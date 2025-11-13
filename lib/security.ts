/**
 * セキュリティ対策ユーティリティ
 * XSS、SQLインジェクション、その他のセキュリティ対策を提供
 */

/**
 * HTMLタグをエスケープしてXSSを防止
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * 文字列をサニタイズ（HTMLタグを削除）
 */
export function sanitizeString(text: string | null | undefined, maxLength?: number): string {
  if (!text) return ''
  
  // HTMLタグを削除
  let sanitized = text.replace(/<[^>]*>/g, '')
  
  // 特殊文字をエスケープ
  sanitized = escapeHtml(sanitized)
  
  // 最大長を制限
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  return sanitized.trim()
}

/**
 * メールアドレスのバリデーション
 */
export function validateEmail(email: string): boolean {
  if (!email || email.length > 255) return false
  
  // 基本的なメールアドレス形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return false
  
  // 危険な文字が含まれていないかチェック
  const dangerousChars = /[<>'"&;]/
  if (dangerousChars.test(email)) return false
  
  return true
}

/**
 * 名前のバリデーションとサニタイズ
 */
export function validateAndSanitizeName(name: string, maxLength: number = 50): string | null {
  if (!name) return null
  
  // 前後の空白を削除
  const trimmed = name.trim()
  
  // 空文字列の場合はnullを返す
  if (trimmed.length === 0) return null
  
  // 最大長をチェック
  if (trimmed.length > maxLength) return null
  
  // HTMLタグをチェック（HTMLタグが含まれている場合は拒否）
  if (/<[^>]*>/.test(trimmed)) return null
  
  // 危険な文字をチェック（&は許可、< > ' " ; は拒否）
  // 注意: &は日本語入力では問題ないが、HTMLエンティティとして解釈される可能性があるため
  // Reactのデフォルトエスケープに任せる（データベースにはそのまま保存）
  if (/[<>'";]/.test(trimmed)) return null
  
  // 制御文字を削除（改行、タブなどは許可しない）
  const sanitized = trimmed.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
  
  return sanitized || null
}

/**
 * パスワードのバリデーション
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'パスワードを入力してください' }
  }
  
  if (password.length < 4) {
    return { valid: false, error: 'パスワードは4文字以上で入力してください' }
  }
  
  if (password.length > 100) {
    return { valid: false, error: 'パスワードは100文字以内で入力してください' }
  }
  
  // 制御文字をチェック
  if (/[\x00-\x1F\x7F]/.test(password)) {
    return { valid: false, error: 'パスワードに無効な文字が含まれています' }
  }
  
  return { valid: true }
}

/**
 * URLのバリデーション
 */
export function validateUrl(url: string): boolean {
  if (!url || url.length > 2048) return false
  
  try {
    const parsed = new URL(url)
    // httpとhttpsのみ許可
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * UUIDのバリデーション
 */
export function validateUuid(uuid: string): boolean {
  if (!uuid) return false
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * トークンのバリデーション（16文字の英数字）
 */
export function validateToken(token: string): boolean {
  if (!token) return false
  
  // 16文字の英数字のみ
  const tokenRegex = /^[a-zA-Z0-9]{16}$/
  return tokenRegex.test(token)
}

/**
 * 日付文字列のバリデーション（YYYY-MM-DD形式）
 */
export function validateDateString(dateString: string): boolean {
  if (!dateString) return false
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) return false
  
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * 時間文字列のバリデーション（HH:MM形式）
 */
export function validateTimeString(timeString: string): boolean {
  if (!timeString) return false
  
  const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(timeString)
}

/**
 * 数値のバリデーション
 */
export function validateNumber(value: string | number, min?: number, max?: number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(num) || !isFinite(num)) return false
  if (min !== undefined && num < min) return false
  if (max !== undefined && num > max) return false
  
  return true
}

/**
 * 緯度経度のバリデーション
 */
export function validateLatitude(lat: number): boolean {
  return validateNumber(lat, -90, 90)
}

export function validateLongitude(lng: number): boolean {
  return validateNumber(lng, -180, 180)
}

/**
 * テキストエリアの内容をサニタイズ
 */
export function sanitizeTextarea(text: string | null | undefined, maxLength: number = 1000): string {
  if (!text) return ''
  
  // HTMLタグを削除
  let sanitized = text.replace(/<[^>]*>/g, '')
  
  // 最大長を制限
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  // 制御文字を削除（改行とタブは許可）
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
  
  return sanitized.trim()
}

/**
 * イベントIDのバリデーション（UUIDまたはトークン）
 */
export function validateEventId(id: string): boolean {
  if (!id) return false
  
  // UUIDまたは16文字以上のトークン（実際のトークンは16文字だが、柔軟に対応）
  // 基本的な文字列チェックのみ（SQLインジェクション対策）
  if (id.length > 100) return false
  
  // 危険な文字が含まれていないかチェック
  if (/[<>'"&;]/.test(id)) return false
  
  // UUID形式または英数字のトークン
  return validateUuid(id) || /^[a-zA-Z0-9]{16,}$/.test(id)
}

/**
 * SQLインジェクション対策：文字列を安全にエスケープ
 * 注意: Supabaseは既にパラメータ化クエリを使用しているため、
 * この関数は追加の防御層として使用
 */
export function escapeSqlLikeString(str: string): string {
  // LIKE句で使用する場合のエスケープ
  return str.replace(/%/g, '\\%').replace(/_/g, '\\_').replace(/\\/g, '\\\\')
}

/**
 * 入力値の長さをチェック
 */
export function validateLength(value: string, min: number, max: number): boolean {
  if (!value) return min === 0
  return value.length >= min && value.length <= max
}

