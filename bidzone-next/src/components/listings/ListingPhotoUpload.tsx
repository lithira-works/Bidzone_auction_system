'use client'

import { type DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { filterImageFiles, MAX_LISTING_IMAGE_BYTES, MAX_LISTING_IMAGES } from '@/lib/listingImages'

type Props = {
  photos: File[]
  onPhotosChange: (files: File[]) => void
  existingUrls?: string[]
  onRemoveExisting?: (index: number) => void
  maxImages?: number
  uploadPrompt: string
  uploadHint: string
  fileTooLargeMessage: string
  tooManyImagesMessage: string
}

export function ListingPhotoUpload({
  photos,
  onPhotosChange,
  existingUrls = [],
  onRemoveExisting,
  maxImages = MAX_LISTING_IMAGES,
  uploadPrompt,
  uploadHint,
  fileTooLargeMessage,
  tooManyImagesMessage,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const previewUrls = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos])

  useEffect(() => {
    return () => {
      previewUrls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [previewUrls])

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const arr = filterImageFiles(list)
      const next = [...photos]
      for (const file of arr) {
        if (file.size > MAX_LISTING_IMAGE_BYTES) {
          window.alert(fileTooLargeMessage)
          continue
        }
        const total = next.length + existingUrls.length
        if (total >= maxImages) {
          window.alert(tooManyImagesMessage)
          break
        }
        next.push(file)
      }
      onPhotosChange(next)
    },
    [photos, existingUrls.length, maxImages, onPhotosChange, fileTooLargeMessage, tooManyImagesMessage],
  )

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index))
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const totalCount = photos.length + existingUrls.length

  return (
    <div className="listing-upload">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        className="listing-upload__file-input"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        className={dragOver ? 'listing-upload__dropzone listing-upload__dropzone--active' : 'listing-upload__dropzone'}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={36} strokeWidth={1.25} className="listing-upload__drop-icon" aria-hidden />
        <span className="listing-upload__drop-title">{uploadPrompt}</span>
        <span className="listing-upload__drop-sub">{uploadHint}</span>
        {totalCount > 0 && (
          <span className="listing-upload__drop-count">
            {totalCount} / {maxImages}
          </span>
        )}
      </button>
      {(previewUrls.length > 0 || existingUrls.length > 0) && (
        <div className="listing-upload__previews">
          {existingUrls.map((url, i) => (
            <div key={`existing-${url.slice(0, 32)}-${i}`} className="listing-upload__preview-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="listing-upload__thumb" />
              {onRemoveExisting && (
                <button
                  type="button"
                  className="listing-upload__remove"
                  aria-label="Remove photo"
                  onClick={() => onRemoveExisting(i)}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          {previewUrls.map((src, i) => (
            <div key={src} className="listing-upload__preview-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="listing-upload__thumb" />
              <button
                type="button"
                className="listing-upload__remove"
                aria-label="Remove photo"
                onClick={() => removePhoto(i)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
