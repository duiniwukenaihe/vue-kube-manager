import request from '@/utils/request'

export function getMySubmitted() {
  return request({
    url: '/api/resource-application/my',
    method: 'get',
    params: { status: 'SUBMITTED' }
  })
}

export function sumbitApplication(data) {
  return request({
    url: '/api/resource-application/submit',
    method: 'post',
    data
  })
}

export function cancelApplication(id) {
  return request({
    url: '/api/resource-application/cancel/' + id,
    method: 'put'
  })
}
