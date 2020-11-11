import Cookies from 'js-cookie'
import store from '@/store'

const TokenKey = 'vue_admin_template_token'

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  return Cookies.set(TokenKey, token)
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}

export function checkPermission(binding) {
  const roles = store.getters && store.getters.roles

  if (binding && binding instanceof Array && binding.length > 0) {
    return roles.some(role => {
      return binding.includes(role)
    })
  } else {
    throw new Error(`need roles! Like ['admin','editor']"`)
  }
}
