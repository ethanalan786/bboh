declare module 'pdf-parse' {
  interface PDFData {
    numpages: number
    numrender: number
    info: any
    metadata: any
    text: string
    version: string
  }
  
  function pdfParse(dataBuffer: any, options?: any): Promise<PDFData>
  
  export = pdfParse
}