export async function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export async function downloadFromUrl(url: string, filename: string) {
  const response = await fetch(url)
  const blob = await response.blob()
  await downloadBlob(blob, filename)
}
