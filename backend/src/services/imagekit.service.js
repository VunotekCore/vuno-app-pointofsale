import ImageKit, { toFile } from '@imagekit/nodejs'
import { BadRequestError } from '../errors/BadRequestError.js'

export class ImageKitService {
  constructor (imagekitPrivateKey, imagekitUrlEndpoint) {
    this.imagekitPrivateKey = imagekitPrivateKey
    this.imagekitUrlEndpoint = imagekitUrlEndpoint
    this.imagekit = null

    if (imagekitPrivateKey && imagekitUrlEndpoint) {
      this.imagekit = new ImageKit({
        privateKey: imagekitPrivateKey,
        urlEndpoint: imagekitUrlEndpoint
      })
    }
  }

  isConfigured () {
    return this.imagekit !== null
  }

  async uploadImage (fileBuffer, fileName, options = {}) {
    if (!this.isConfigured()) {
      throw new BadRequestError('ImageKit no está configurado para esta empresa')
    }

    const { folder = '/products', tags = [] } = options

    try {
      const file = await toFile(fileBuffer, fileName)

      const result = await this.imagekit.files.upload({
        file,
        fileName,
        folder,
        tags,
        useUniqueFileName: true
      })

      return {
        url: result.url,
        fileId: result.fileId,
        name: result.name,
        width: result.width,
        height: result.height
      }
    } catch (error) {
      console.error('ImageKit upload error:', error)
      throw new BadRequestError('Error al subir imagen: ' + error.message)
    }
  }

  getProductImageUrl (imagePath, width = 512, height = 512) {
    if (!imagePath || !this.isConfigured()) {
      return imagePath
    }

    let path = imagePath
    if (imagePath.startsWith('http')) {
      try {
        const url = new URL(imagePath)
        path = url.pathname
      } catch {
        return imagePath
      }
    }

    return this.imagekit.helper.buildSrc({
      urlEndpoint: this.imagekitUrlEndpoint,
      src: path,
      transformation: [{ width: String(width), height: String(height), focus: 'auto' }]
    })
  }

  getThumbnailUrl (imagePath, size = 128) {
    return this.getProductImageUrl(imagePath, size, size)
  }
}
