// エラーメッセージを日本語に変換する関数
export function getJapaneseErrorMessage(error: any): string {
  if (!error) return 'エラーが発生しました'
  
  // エラーコードに基づく日本語メッセージ
  if (error.code === '23505') {
    return '重複したデータが存在します'
  }
  if (error.code === '23503') {
    return '参照先のデータが見つかりませんでした'
  }
  if (error.code === '23502') {
    return '必須項目が入力されていません'
  }
  if (error.code === 'PGRST116') {
    return '権限がありません'
  }
  if (error.message) {
    // 英語のエラーメッセージを日本語に変換
    const message = error.message.toLowerCase()
    if (message.includes('duplicate key')) {
      return '重複したデータが存在します'
    }
    if (message.includes('foreign key')) {
      return '参照先のデータが見つかりませんでした'
    }
    if (message.includes('not null')) {
      return '必須項目が入力されていません'
    }
    if (message.includes('permission') || message.includes('policy')) {
      return '権限がありません'
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'ネットワークエラーが発生しました。インターネット接続を確認してください'
    }
  }
  
  return 'エラーが発生しました。しばらく時間をおいて再度お試しください'
}

