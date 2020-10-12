import request from '@/utils/request'

export function getList(params) {
  return request({
    url: '/mockapi/table/list',
    method: 'get',
    params
  })
}
