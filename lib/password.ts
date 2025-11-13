import bcrypt from 'bcryptjs'

/**
 * パスワードをハッシュ化する
 * @param password 平文のパスワード
 * @returns ハッシュ化されたパスワード
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

/**
 * パスワードを検証する
 * @param password 平文のパスワード
 * @param hash ハッシュ化されたパスワード
 * @returns 一致する場合true
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

