import request from '@/utils/request'

export function listTemplate(params) {
  return request({
    url: '/api/experiment/template',
    method: 'get',
    params
  })
}

export function createTemplate(data) {
  return request({
    url: '/api/experiment/template',
    method: 'post',
    data
  })
}

export function updateTemplate(data) {
  return request({
    url: '/api/experiment/template',
    method: 'put',
    data
  })
}

export function deleteTemplate(namespace, name) {
  return request({
    url: '/api/experiment/template',
    method: 'delete',
    params: { namespace: namespace, name: name }
  })
}

export function listTask(params) {
  return request({
    url: '/api/experiment/task',
    method: 'get',
    params
  })
}

export function startInstance(params) {
  return request({
    url: '/api/experiment/task',
    method: 'get',
    params
  })
}

export function restartInstance(params) {
  return request({
    url: '/api/experiment/task',
    method: 'get',
    params
  })
}

export function shutdownInstance(params) {
  return request({
    url: '/api/experiment/task',
    method: 'get',
    params
  })
}
