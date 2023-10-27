const logReqBody = (req, res, next) => {
  console.log('\n', req.method, req.originalUrl, ' ===> ', '\n')
  console.table(req.body)
  next()
}

module.exports = { logReqBody }
