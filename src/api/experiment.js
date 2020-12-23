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

export function startInstance(id) {
  return request({
    url: '/api/experiment/instance/start/' + id,
    method: 'put'
  })
}

export function restartInstance(id) {
  return request({
    url: '/api/experiment/instance/restart/' + id,
    method: 'put'
  })
}

export function shutdownInstance(id) {
  return request({
    url: '/api/experiment/instance/shutdown/' + id,
    method: 'put'
  })
}
