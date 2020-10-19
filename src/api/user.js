import request from '@/utils/request'

export function login(username, password) {
  return request({
    url: '/spring/login',
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
    url: '/spring/logout',
    method: 'post'
  })
}
