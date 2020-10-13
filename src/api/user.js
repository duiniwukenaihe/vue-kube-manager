import request from '@/utils/request'

export function login(username, password) {
  return request({
    url: '/user/login',
    method: 'post',
    params: {
      username: username,
      password: password
    }
  })
}

export function getInfo(token) {
  return request({
    url: '/mockapi/user/info',
    method: 'get',
    params: { token }
  })
}

export function logout() {
  return request({
    url: '/mockapi/user/logout',
    method: 'post'
  })
}
