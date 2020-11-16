import request from '@/utils/request'

export function getCurrencyConfig(code) {
  return request({
    url: '/api/currency/config',
    method: 'get',
    params: { code: code }
  })
}

export function getCurrencyData(code) {
  return request({
    url: '/api/currency/data',
    method: 'get',
    params: { code: code }
  })
}
