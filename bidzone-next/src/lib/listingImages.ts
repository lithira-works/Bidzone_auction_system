export const MAX_LISTING_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_LISTING_IMAGES = 8
export const MAX_DATA_URL_LENGTH = 2_400_000

export type ListingImageError = 'too_large' | 'no_image'

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read'))
    reader.readAsDataURL(file)
  })
}

export async function filesToListingImages(
  files: File[],
  options?: {
    existingUrls?: string[]
    fallbackUrl?: string
  },
): Promise<{ image: string; images: string[] } | { error: ListingImageError }> {
  const urls: string[] = [...(options?.existingUrls?.filter(Boolean) ?? [])]

  for (const file of files) {
    const dataUrl = await readFileAsDataUrl(file)
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      return { error: 'too_large' }
    }
    urls.push(dataUrl)
  }

  const unique = urls.slice(0, MAX_LISTING_IMAGES)

  if (unique.length === 0) {
    if (options?.fallbackUrl) {
      return { image: options.fallbackUrl, images: [options.fallbackUrl] }
    }
    return { error: 'no_image' }
  }

  return { image: unique[0], images: unique }
}

export function filterImageFiles(list: FileList | File[]): File[] {
  return Array.from(list).filter((f) => f.type.startsWith('image/'))
}
