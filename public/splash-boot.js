(function () {
  var key = "mahfuz:splash:v1"
  var root = document.documentElement
  try {
    if (!sessionStorage.getItem(key)) root.setAttribute("data-splash-active", "true")
  } catch {
    root.setAttribute("data-splash-active", "true")
  }
  window.setTimeout(function () { root.removeAttribute("data-splash-active") }, 12000)
})()
