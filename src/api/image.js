import request from '@/utils/request'

export function listImage(query) {
  return request({
    url: '/api/image',
    method: 'get',
    params: query
  })
}

export function getImageByName(name) {
  return request({
    url: '/api/image',
    method: 'get',
    params: { name: name }
  })
}

export function deleteImage(id) {
  return request({
    url: '/api/image/' + id,
    method: 'delete'
  })
}

export function uploadImage(data) {
  return request({
    url: '/api/registry/image',
    method: 'post',
    data
  })
}
