export interface FetchOptions extends RequestInit {
  email: string
  role: string
}

export async function apiFetch(url: string, options: FetchOptions) {
  const { email, role, headers, ...fetchOptions } = options

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      'x-user-email': email,
      'x-user-role': role,
      ...headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response
}
