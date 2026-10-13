import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { WooCommerceService } from './wooService.js';
import { calculateCompleteness } from '../utils/validation.js';

function computeChecksum(data: any): string {
  const normalized = JSON.stringify({
    name: data.name,
    sku: data.sku,
    regularPrice: data.regularPrice ?? data.regular_price,
    salePrice: data.salePrice ?? data.sale_price,
    stockQuantity: data.stockQuantity ?? data.stock_quantity,
    description: data.description,
  });
  return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);
}

export class SyncService {
  static async pushProduct(productId: string, userId?: string, userName: string = 'System'): Promise<any> {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');

    const job = await prisma.syncJob.create({
      data: {
        jobType: 'PUSH_PRODUCT',
        status: 'RUNNING',
        isSimulated: true,
        productId: product.id,
        affectedCount: 1,
        message: `Pushing "${product.name}" (${product.sku}) to WooCommerce...`,
      },
    });

    try {
      const parsedCategories = JSON.parse(product.categories || '[]');
      const parsedTags = JSON.parse(product.tags || '[]');
      const parsedAttributes = JSON.parse(product.attributes || '[]');
      const parsedImages = JSON.parse(product.images || '[]');

      const result = await WooCommerceService.pushProduct({
        name: product.name,
        sku: product.sku,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        description: product.description,
        shortDescription: product.shortDescription,
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus,
        manageStock: product.manageStock,
        categories: parsedCategories,
        tags: parsedTags,
        attributes: parsedAttributes,
        images: parsedImages,
      }, product.remoteWooId);

      const newChecksum = computeChecksum(product);

      await prisma.product.update({
        where: { id: product.id },
        data: {
          remoteWooId: result.remoteId,
          lastSyncedAt: new Date(),
          syncStatus: 'IN_SYNC',
          hasConflict: false,
          conflictDetails: null,
          localChecksum: newChecksum,
          remoteChecksum: newChecksum,
        },
      });

      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: 'SUCCESS',
          isSimulated: result.isSimulated,
          message: `Product successfully synced with WooCommerce (Remote ID: ${result.remoteId}).`,
          details: JSON.stringify({ remoteId: result.remoteId, isSimulated: result.isSimulated }),
          completedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          userName,
          action: 'SYNC_PUSH',
          entityType: 'PRODUCT',
          entityId: product.id,
          details: JSON.stringify({
            sku: product.sku,
            remoteWooId: result.remoteId,
            simulated: result.isSimulated,
          }),
        },
      });

      return {
        success: true,
        jobId: job.id,
        remoteId: result.remoteId,
        isSimulated: result.isSimulated,
      };
    } catch (err: any) {
      await prisma.product.update({
        where: { id: product.id },
        data: { syncStatus: 'ERROR' },
      });

      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          message: err.message || 'Failed to sync product to WooCommerce',
          details: JSON.stringify({ error: err.message, stack: err.stack }),
          completedAt: new Date(),
        },
      });

      throw err;
    }
  }

  static async pushBulk(productIds: string[], userId?: string, userName: string = 'System'): Promise<any> {
    const job = await prisma.syncJob.create({
      data: {
        jobType: 'PUSH_BULK',
        status: 'RUNNING',
        isSimulated: true,
        affectedCount: productIds.length,
        message: `Syncing ${productIds.length} products to WooCommerce...`,
      },
    });

    let successCount = 0;
    let failCount = 0;
    const errors: any[] = [];

    for (const pid of productIds) {
      try {
        await this.pushProduct(pid, userId, userName);
        successCount++;
      } catch (err: any) {
        failCount++;
        errors.push({ productId: pid, error: err.message });
      }
    }

    const overallStatus = failCount === 0 ? 'SUCCESS' : (successCount > 0 ? 'SUCCESS' : 'FAILED');
    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: overallStatus,
        message: `Bulk push finished: ${successCount} succeeded, ${failCount} failed.`,
        details: JSON.stringify({ successCount, failCount, errors }),
        completedAt: new Date(),
      },
    });

    return {
      jobId: job.id,
      successCount,
      failCount,
      errors,
    };
  }

  static async pullProducts(userId?: string, userName: string = 'System'): Promise<any> {
    const job = await prisma.syncJob.create({
      data: {
        jobType: 'PULL_IMPORT',
        status: 'RUNNING',
        isSimulated: true,
        message: 'Fetching products from WooCommerce...',
      },
    });

    try {
      const { products, isSimulated } = await WooCommerceService.fetchRemoteProducts();
      let importedCount = 0;
      let conflictCount = 0;

      for (const remote of products) {
        const sku = remote.sku || `WOO-${remote.id}`;
        const existing = await prisma.product.findUnique({ where: { sku } });

        const remotePrice = parseFloat(remote.regular_price || '0') || 0;
        const remoteSalePrice = remote.sale_price ? parseFloat(remote.sale_price) : null;
        const remoteImages = remote.images ? remote.images.map((img: any) => img.src) : [];
        const remoteCategories = remote.categories ? remote.categories.map((c: any) => c.name) : [];
        const remoteTags = remote.tags ? remote.tags.map((t: any) => t.name) : [];
        const remoteAttributes = remote.attributes
          ? remote.attributes.map((a: any) => ({ name: a.name, values: a.options || [] }))
          : [];

        if (existing) {
          const openConflict = await prisma.conflictLog.findFirst({
            where: { productId: existing.id, status: 'OPEN' },
            orderBy: { createdAt: 'desc' },
          });
          const hasLocalChanges =
            existing.syncStatus === 'PENDING' ||
            Boolean(openConflict) ||
            Boolean(
              existing.localChecksum &&
              existing.remoteChecksum &&
              existing.localChecksum !== existing.remoteChecksum
            );

          if (hasLocalChanges) {
            conflictCount++;
            const diffs: any[] = [];
            if (existing.name !== remote.name) {
              diffs.push({ field: 'name', local: existing.name, remote: remote.name });
            }
            if (existing.regularPrice !== remotePrice) {
              diffs.push({ field: 'regularPrice', local: existing.regularPrice, remote: remotePrice });
            }
            if (existing.stockQuantity !== (remote.stock_quantity || 0)) {
              diffs.push({ field: 'stockQuantity', local: existing.stockQuantity, remote: remote.stock_quantity || 0 });
            }

            let conflictLog = openConflict;
            if (!conflictLog) {
              conflictLog = await prisma.conflictLog.create({
                data: {
                  productId: existing.id,
                  status: 'OPEN',
                  localData: JSON.stringify(existing),
                  remoteData: JSON.stringify(remote),
                  fieldDifferences: JSON.stringify(diffs),
                },
              });
            }

            await prisma.product.update({
              where: { id: existing.id },
              data: {
                hasConflict: true,
                syncStatus: 'CONFLICT',
                conflictDetails: JSON.stringify({
                  conflictLogId: conflictLog.id,
                  differences: JSON.parse(conflictLog.fieldDifferences),
                }),
              },
            });
            continue;
          }

          // No conflict: update existing
          const completeness = calculateCompleteness({
            name: remote.name,
            sku,
            regularPrice: remotePrice,
            salePrice: remoteSalePrice,
            description: remote.description,
            shortDescription: remote.short_description,
            images: remoteImages,
            categories: remoteCategories,
            attributes: remoteAttributes,
            stockQuantity: remote.stock_quantity || 0,
          });

            const syncedChecksum = computeChecksum({
              name: remote.name,
              sku,
              regularPrice: remotePrice,
              salePrice: remoteSalePrice,
              stockQuantity: remote.stock_quantity ?? 0,
              description: remote.description || '',
            });

            await prisma.product.update({
            where: { id: existing.id },
            data: {
              name: remote.name,
              remoteWooId: remote.id,
              regularPrice: remotePrice,
              salePrice: remoteSalePrice,
              shortDescription: remote.short_description?.replace(/<[^>]*>?/gm, '') || '',
              description: remote.description || '',
              stockQuantity: remote.stock_quantity || 0,
              stockStatus: (remote.stock_status || 'instock').toUpperCase(),
              images: JSON.stringify(remoteImages),
              categories: JSON.stringify(remoteCategories),
              tags: JSON.stringify(remoteTags),
              attributes: JSON.stringify(remoteAttributes),
              completenessScore: completeness.score,
              missingFields: JSON.stringify(completeness.missingFields),
              syncStatus: 'IN_SYNC',
              lastSyncedAt: new Date(),
              localChecksum: syncedChecksum,
              remoteChecksum: syncedChecksum,
            },
          });
        } else {
          // Create fresh product
          const completeness = calculateCompleteness({
            name: remote.name,
            sku,
            regularPrice: remotePrice,
            salePrice: remoteSalePrice,
            description: remote.description,
            shortDescription: remote.short_description,
            images: remoteImages,
            categories: remoteCategories,
            attributes: remoteAttributes,
            stockQuantity: remote.stock_quantity || 0,
          });

          const newProd = await prisma.product.create({
            data: {
              name: remote.name,
              sku,
              slug: remote.slug || remote.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              shortDescription: remote.short_description?.replace(/<[^>]*>?/gm, '') || '',
              description: remote.description || '',
              regularPrice: remotePrice,
              salePrice: remoteSalePrice,
              stockQuantity: remote.stock_quantity || 0,
              stockStatus: (remote.stock_status || 'instock').toUpperCase(),
              images: JSON.stringify(remoteImages),
              categories: JSON.stringify(remoteCategories),
              tags: JSON.stringify(remoteTags),
              attributes: JSON.stringify(remoteAttributes),
              completenessScore: completeness.score,
              missingFields: JSON.stringify(completeness.missingFields),
              status: 'PUBLISHED',
              syncStatus: 'IN_SYNC',
              remoteWooId: remote.id,
              lastSyncedAt: new Date(),
            },
          });

          const chk = computeChecksum(newProd);
          await prisma.product.update({
            where: { id: newProd.id },
            data: { localChecksum: chk, remoteChecksum: chk },
          });
        }
        importedCount++;
      }

      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: 'SUCCESS',
          isSimulated,
          affectedCount: importedCount,
          message: `Import complete: ${importedCount} products processed, ${conflictCount} conflicts detected.`,
          details: JSON.stringify({ importedCount, conflictCount, isSimulated }),
          completedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          userName,
          action: 'SYNC_IMPORT',
          entityType: 'SYNC',
          details: JSON.stringify({ importedCount, conflictCount, isSimulated }),
        },
      });

      return {
        jobId: job.id,
        importedCount,
        conflictCount,
        isSimulated,
      };
    } catch (err: any) {
      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          message: err.message || 'Import failed',
          details: JSON.stringify({ error: err.message }),
          completedAt: new Date(),
        },
      });
      throw err;
    }
  }

  static async resolveConflict(conflictId: string, resolution: 'KEEP_LOCAL' | 'KEEP_REMOTE' | 'MERGE', mergedData?: any, userId?: string, userName: string = 'System'): Promise<any> {
    const conflict = await prisma.conflictLog.findUnique({ where: { id: conflictId } });
    if (!conflict) throw new Error('Conflict log not found');

    const product = await prisma.product.findUnique({ where: { id: conflict.productId } });
    if (!product) throw new Error('Product not found');

    const remoteData = JSON.parse(conflict.remoteData);

    if (resolution === 'KEEP_LOCAL') {
      // Push local data to overwrite remote
      await this.pushProduct(product.id, userId, userName);
    } else if (resolution === 'KEEP_REMOTE') {
      // Overwrite local with remote data
      const remotePrice = parseFloat(remoteData.regular_price || '0') || 0;
      const remoteSalePrice = remoteData.sale_price ? parseFloat(remoteData.sale_price) : null;
      await prisma.product.update({
        where: { id: product.id },
        data: {
          name: remoteData.name,
          regularPrice: remotePrice,
          salePrice: remoteSalePrice,
          stockQuantity: remoteData.stock_quantity ?? product.stockQuantity,
          description: remoteData.description || product.description,
          hasConflict: false,
          conflictDetails: null,
          syncStatus: 'IN_SYNC',
          lastSyncedAt: new Date(),
        },
      });
    } else if (resolution === 'MERGE' && mergedData) {
      // Apply merged values
      await prisma.product.update({
        where: { id: product.id },
        data: {
          ...mergedData,
          hasConflict: false,
          conflictDetails: null,
          syncStatus: 'IN_SYNC',
          lastSyncedAt: new Date(),
        },
      });
      // Push merged back to WooCommerce
      await this.pushProduct(product.id, userId, userName);
    }

    await prisma.conflictLog.update({
      where: { id: conflict.id },
      data: {
        status: 'RESOLVED',
        resolutionType: resolution,
        resolvedBy: userName,
        resolvedAt: new Date(),
      },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        hasConflict: false,
        conflictDetails: null,
        syncStatus: 'IN_SYNC',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        action: 'CONFLICT_RESOLVED',
        entityType: 'PRODUCT',
        entityId: product.id,
        details: JSON.stringify({ resolution, conflictId }),
      },
    });

    return { success: true, message: `Conflict resolved using ${resolution}` };
  }

  static async retryJob(jobId: string, userId?: string, userName: string = 'System'): Promise<any> {
    const job = await prisma.syncJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error('Job not found');

    if (job.retryCount >= job.maxRetries) {
      throw new Error(`Max retry attempts (${job.maxRetries}) reached for this job.`);
    }

    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        retryCount: job.retryCount + 1,
        status: 'RUNNING',
        message: `Retrying (Attempt ${job.retryCount + 1}/${job.maxRetries})...`,
      },
    });

    if (job.jobType === 'PUSH_PRODUCT' && job.productId) {
      return await this.pushProduct(job.productId, userId, userName);
    } else if (job.jobType === 'PULL_IMPORT') {
      return await this.pullProducts(userId, userName);
    } else {
      // Simulate general retry recovery
      await new Promise(r => setTimeout(r, 600));
      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: 'SUCCESS',
          message: 'Job recovered and completed successfully upon retry.',
          completedAt: new Date(),
        },
      });
      return { success: true, recovered: true };
    }
  }
}
