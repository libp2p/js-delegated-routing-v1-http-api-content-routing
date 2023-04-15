import EchoServer from 'aegir/echo-server'
import body from 'body-parser'

export default {
  test: {
    before: async () => {
      const providers = new Map()
      const echoServer = new EchoServer()
      echoServer.polka.use(body.text())
      echoServer.polka.post('/add-providers/:cid', (req, res) => {
        providers.set(req.params.cid, req.body)
        res.end()
      })

      // https://github.com/ipfs/specs/blob/main/routing/ROUTING_V1_HTTP.md#api
      echoServer.polka.get('/routing/v1/providers/:cid', (req, res) => {
        const provs = providers.get(req.params.cid)
        providers.delete(req.params.cid)

        // 404 means no matching records are found
        if (provs == null) {
          res.statusCode = 404
          return res.end()
        }

        res.end(provs)
      })

      await echoServer.start()

      return {
        env: {
          ECHO_SERVER: `http://${echoServer.host}:${echoServer.port}`
        },
        echoServer
      }
    },
    after: async (options, beforeResult) => {
      await beforeResult.echoServer.stop()
    }
  }
}
