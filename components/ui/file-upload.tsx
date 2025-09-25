"use client"

import * as React from "react"
import { Upload, X, FileText, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number
  className?: string
}

export function FileUpload({
  onFileSelect,
  accept = ".png,.jpg,.jpeg,.xlsx,.xls",
  maxSize = 5 * 1024 * 1024,
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      alert(`File terlalu besar. Maksimal ${maxSize / (1024 * 1024)}MB`)
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    if (extension === "xlsx" || extension === "xls") {
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />
    }
    return <FileText className="h-8 w-8 text-blue-500" />
  }

  return (
    <div className={cn("w-full", className)}>
      <input ref={inputRef} type="file" accept={accept} onChange={handleInputChange} className="hidden" />

      {!selectedFile ? (
        <Card
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer hover:border-navy-400",
            dragActive ? "border-navy-500 bg-navy-50" : "border-gray-300",
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-8 px-4">
            <Upload className="h-10 w-10 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 text-center mb-2">
              <span className="font-medium text-navy-600">Klik untuk upload</span> atau drag & drop file
            </p>
            <p className="text-xs text-gray-500 text-center">PNG, JPG, XLSX, XLS (max {maxSize / (1024 * 1024)}MB)</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-navy-200">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              {getFileIcon(selectedFile.name)}
              <div>
                <p className="text-sm font-medium text-navy-800">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFile} className="text-gray-500 hover:text-red-500">
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
