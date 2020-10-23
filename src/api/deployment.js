import request from '@/utils/request'

export function listDeployment(query) {
  return request({
    url: '/api/deployment',
    method: 'get',
    params: query
  })
}

export function createDeployment(data) {
  return request({
    url: '/api/deployment',
    method: 'post',
    data
  })
}

export function updateDeployment(data) {
  return request({
    url: '/api/deployment',
    method: 'put',
    data
  })
}

export function deleteDeployment(namespace, name) {
  return request({
    url: '/api/deployment',
    method: 'delete',
    params: { namespace: namespace, name: name }
  })
}

export function scaleDeployment(data) {
  return request({
    url: '/api/deployment/scale',
    method: 'patch',
    data
  })
}

export function fetchPv(pv) {
  return request({
    url: '/mockapi/article/pv',
    method: 'get',
    params: { pv }
  })
}
