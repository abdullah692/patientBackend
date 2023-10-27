const validateRoute = (req, res) => {
  res.status(404).send({
    error: 'route not found',
    method: req.method,
    url: req.originalUrl,
  })
}

module.exports = validateRoute
