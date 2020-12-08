import request from '@/utils/request'

export function login(username, password) {
  return request({
    url: '/api/login',
    method: 'post',
    params: {
      username: username,
      password: password
    }
  })
}

export function getInfo(token) {
  return request({
    url: '/api/user/info',
    method: 'get',
    params: { token }
  })
}

export function logout() {
  return request({
    url: '/api/logout',
    method: 'post'
  })
}

export function listUser(query) {
  return request({
    url: '/api/user',
    method: 'get',
    params: query
  })
}

export function updateUser(data) {
  return request({
    url: '/api/user',
    method: 'put',
    data
  })
}

export function enableUser(id) {
  return request({
    url: '/api/user/enable/' + id,
    method: 'put'
  })
}

export function disableUser(id) {
  return request({
    url: '/api/user/disable/' + id,
    method: 'put'
  })
}
