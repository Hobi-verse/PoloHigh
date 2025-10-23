const { cloudinary, isConfigured } = require("../config/cloudinary");

const DATA_URI_REGEX = /^data:(.+);base64,/i;
const REMOTE_URL_REGEX = /^https?:\/\//i;

const sanitizeFolderName = (segment = "") =>
  segment
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildFolderPath = (slug, explicitFolder) => {
  const base = sanitizeFolderName(process.env.CLOUDINARY_ASSET_BASE_FOLDER || "ciyatake");
  const folderSegments = [base, "products"];

  if (explicitFolder) {
    folderSegments.push(sanitizeFolderName(explicitFolder));
  } else if (slug) {
    folderSegments.push(sanitizeFolderName(slug));
  }

  return folderSegments.filter(Boolean).join("/");
};

const normalizeMediaType = (type) => (type === "video" ? "video" : "image");

const uploadProductMedia = async (media = [], options = {}) => {
  if (!Array.isArray(media) || media.length === 0) {
    return { media: [], mapping: new Map() };
  }

  if (!isConfigured) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  const uploadCache = new Map();
  const mapping = new Map();
  const processed = [];
  const folder = buildFolderPath(options.slug, options.folder);

  for (const item of media) {
    if (!item || typeof item.url !== "string" || !item.url.trim()) {
      continue;
    }

    const originalUrl = item.url.trim();
    const mediaType = normalizeMediaType(item.type);

    if (mapping.has(originalUrl)) {
      const cached = mapping.get(originalUrl);
      const cachedInfo = uploadCache.get(originalUrl);
      processed.push(
        Object.assign({}, item, {
          url: cached,
          cloudinaryId: cachedInfo?.cloudinaryId ?? item.cloudinaryId ?? null,
          cloudinaryResourceType: cachedInfo?.resourceType ?? item.cloudinaryResourceType ?? mediaType,
        })
      );
      continue;
    }

    if (REMOTE_URL_REGEX.test(originalUrl) && !DATA_URI_REGEX.test(originalUrl)) {
      mapping.set(originalUrl, originalUrl);
      processed.push(
        Object.assign({}, item, {
          url: originalUrl,
          cloudinaryId: item.cloudinaryId ?? null,
          cloudinaryResourceType: item.cloudinaryResourceType ?? mediaType,
        })
      );
      continue;
    }

    if (!DATA_URI_REGEX.test(originalUrl)) {
      mapping.set(originalUrl, originalUrl);
      processed.push(Object.assign({}, item));
      continue;
    }

    let uploadInfo = uploadCache.get(originalUrl);

    if (!uploadInfo) {
      const uploadOptions = {
        folder,
        resource_type: mediaType,
        overwrite: false,
        unique_filename: true,
        use_filename: false,
      };

      if (mediaType === "image") {
        uploadOptions.transformation = [{ quality: "auto", fetch_format: "auto" }];
      }

      // eslint-disable-next-line no-await-in-loop
      const response = await cloudinary.uploader.upload(originalUrl, uploadOptions);

      uploadInfo = {
        url: response.secure_url,
        cloudinaryId: response.public_id,
        resourceType: response.resource_type || mediaType,
        width: response.width,
        height: response.height,
        bytes: response.bytes,
      };

      uploadCache.set(originalUrl, uploadInfo);
    }

    mapping.set(originalUrl, uploadInfo.url);

    const sanitizedItem = Object.assign({}, item, {
      url: uploadInfo.url,
      cloudinaryId: uploadInfo.cloudinaryId,
      cloudinaryResourceType: uploadInfo.resourceType,
    });

    if (sanitizedItem.thumbnail && DATA_URI_REGEX.test(sanitizedItem.thumbnail)) {
      sanitizedItem.thumbnail = uploadInfo.url;
    }

    processed.push(sanitizedItem);
  }

  return { media: processed, mapping };
};

const deleteCloudinaryAssets = async (assets = []) => {
  if (!isConfigured || !Array.isArray(assets) || assets.length === 0) {
    return;
  }

  const grouped = assets.reduce((accumulator, asset) => {
    if (!asset || !asset.cloudinaryId) {
      return accumulator;
    }

    const resourceType = normalizeMediaType(asset.cloudinaryResourceType);
    if (!accumulator.has(resourceType)) {
      accumulator.set(resourceType, new Set());
    }

    accumulator.get(resourceType).add(asset.cloudinaryId);
    return accumulator;
  }, new Map());

  for (const [resourceType, idSet] of grouped.entries()) {
    const ids = Array.from(idSet);
    for (let index = 0; index < ids.length; index += 100) {
      const chunk = ids.slice(index, index + 100);
      try {
        // eslint-disable-next-line no-await-in-loop
        await cloudinary.api.delete_resources(chunk, { resource_type: resourceType });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to delete Cloudinary assets", {
          resourceType,
          ids: chunk,
          error: error?.message ?? error,
        });
      }
    }
  }
};

module.exports = {
  uploadProductMedia,
  deleteCloudinaryAssets,
  isCloudinaryConfigured: () => isConfigured,
};
