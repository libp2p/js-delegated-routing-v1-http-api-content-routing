# ⛔️ DEPRECATED

As of `1.1.0` the [@helia/delegated-routing-v1-http-api-client](https://www.npmjs.com/package/@helia/delegated-routing-v1-http-api-client) module supports both the libp2p [ContentRouting](https://libp2p.github.io/js-libp2p/interfaces/_libp2p_interface.content_routing.ContentRouting.html) and [PeerRouting](https://libp2p.github.io/js-libp2p/interfaces/_libp2p_interface.peer_routing.PeerRouting.html) interfaces so should be used instead.

_This library will not be maintained._

---

# @libp2p/delegated-routing-v1-http-api-content-routing <!-- omit in toc -->

[![libp2p.io](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![Discuss](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg?style=flat-square)](https://discuss.libp2p.io)
[![codecov](https://img.shields.io/codecov/c/github/libp2p/js-delegated-routing-v1-http-api-content-routing.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-delegated-routing-v1-http-api-content-routing)
[![CI](https://img.shields.io/github/actions/workflow/status/libp2p/js-delegated-routing-v1-http-api-content-routing/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/libp2p/js-delegated-routing-v1-http-api-content-routing/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> Use a Delegated Routing V1 HTTP service to discover content providers

This is a [ContentRouting](https://libp2p.github.io/js-libp2p/interfaces/_libp2p_interface.content_routing.ContentRouting.html)
implementation that makes use of the [@helia/delegated-routing-v1-http-api-client](https://www.npmjs.com/package/@helia/delegated-routing-v1-http-api-client)
to use servers that implement the snappily-titled [Delegated Routing V1 HTTP API](https://specs.ipfs.tech/routing/http-routing-v1/)
spec to get/put IPNS records and to resolve providers for CIDs.

## Table of contents <!-- omit in toc -->

- - [Install](#install)
    - [Browser `<script>` tag](#browser-script-tag)
- [Example](#example)
  - [API Docs](#api-docs)
  - [License](#license)
  - [Contribution](#contribution)

## Install

```console
$ npm i @libp2p/delegated-routing-v1-http-api-content-routing
```

### Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `Libp2pDelegatedRoutingV1HttpApiContentRouting` in the global namespace.

```html
<script src="https://unpkg.com/@libp2p/delegated-routing-v1-http-api-content-routing/dist/index.min.js"></script>
```

# Example

```js
import { createLibp2p } from 'libp2p'
import { delgatedRoutingV1HTTPAPIContentRouting } from '@libp2p/delegated-routing-http-v1-content-routing'

const node = await createLibp2p({
  contentRouters: [
    delgatedRoutingV1HTTPAPIContentRouting('https://example.org')
  ]
  //.. other config
})
await node.start()

for await (const provider of node.contentRouting.findProviders('cid')) {
  console.log('provider', provider)
}
```

## API Docs

- <https://libp2p.github.io/js-delegated-routing-v1-http-api-content-routing>

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
