import {Community, EcdsaKey, ChainTree, setDataTransaction} from 'tupelo-wasm-sdk'
import debug from 'debug'

const isNode = require('is-node')

const log = debug("ambient-community")

let _appCommunityPromise: Promise<Community>

declare const window:any;
declare const Go:any;
// if (!isNode) {
//     window.Community = Community
//     const subDirectory = window.location.pathname
//     log("subDirectory ", subDirectory)
  
//     if (subDirectory !== '/') {
//       log("setting wasmpath to: ", subDirectory + "/tupelo.wasm")
//       Go.setWasmPath(subDirectory + "/tupelo.wasm");
//     }
// }

const devCommunityConfig = `
id = "tupelolocal"
BootstrapAddresses = [
    "/ip4/127.0.0.1/tcp/50001/ws/ipfs/16Uiu2HAmVGfmbkFFe3c9tHUioE2Q8j7VYrTDAn7Q6bH7coJPvUpv",
    "/ip4/127.0.0.1/tcp/50000/ws/ipfs/16Uiu2HAm3TGSEKEjagcCojSJeaT5rypaeJMKejijvYSnAjviWwV5", #bootstrap node websocket is last
]
[[signers]]
VerKeyHex = "0x15796b266a7d6b7c6b29c5bf97ad376fe8457e4d56bb0612ec8703c65ca7b6bb5dca004d55f5238d7764cd100c9e9cac3c5abce902bae8a5f9c29de716a145595b071b1b7038a48b4f6f88e7664b38c02062f64b3ceb499e4cbb82361457dcd731f5b48901871e7fd56a9c91ab3e06d3f7cb27288962686d9a05e02c1482f01f"
DestKeyHex = "0x04f6dee3f7da1da58afd6ee58ea6b858fb67664fc6e2240bb6e3a75c0e1db9bbef5f413c8604bb864513d3cf27eca60b539b048b2a08f8799570c14dfb73f3f391"

[[signers]]
VerKeyHex = "0x7be8c92c8c295ef3e97be28f469f5f94d10ee7db4d202776bee5cf55c62d508a0c3550a19342d768ff073c0798ce003646df586ef588a9e9443a0ca86a234ed15150dc98ecc3f1071649fca03426f1c8c215a90752f51faa3e2e788e1dae2e9e5cf87c1ca4239a0949a0ba6ea09c061a538372cc4230dedafae929b170ad7704"
DestKeyHex = "0x0438b196bddb9c3ec395b8ccb07bdab44ec768c084e7141b09ac5638d47fffbd5e7b7623f499a2e714e31464a356a0e30ad7c93045b6cd9957b45e957cc15dcb99"

[[signers]]
VerKeyHex = "0x88aefad94805db01cacaf190f47bc9e40f584b5085c651da168ac4034d570b4750bf7b23803d204e483e407a5ca34ee7f7a434733346451cf3f5d26c0d11e5ac45398a03fbba2d3b0dfc21cdf14615430cea394bd9423d8527eaa82a96aa6d20655724d99770ee3488b6537d6be143b84b21ad5ee12c190048757fe453313fd2"
DestKeyHex = "0x0468924bd1341b5cec1fed888aaf1e3caa94e7d0f13d4f4573b01b296374b9e710a58a7b40e7161c0bcf7fd41832441ca21076f3846e854c8d8c640f2469a552b1"
`

export function getAppCommunity(): Promise<Community> {
    log("fetching app community")
    if (_appCommunityPromise !== undefined) {
        return _appCommunityPromise
    }
    _appCommunityPromise = new Promise(async (resolve) => {
        let c: Community
        switch (process.env.NODE_ENV) {
            case "production":
                log("using production community")
                c = await Community.getDefault()
                break;
            default:
                log("using development community and wasm at: ", Go.wasmpath)
                c = await Community.fromNotaryGroupToml(devCommunityConfig)
                Community.setDefault(c)
                // in dev we want to actually do a transaction in order to make sure that Community has some state
                const key = await EcdsaKey.generate()
                const tree = await ChainTree.newEmptyTree(c.blockservice, key)
                await c.playTransactions(tree, [setDataTransaction("/started", (new Date()).getDate())])
        }
        resolve(c)
    })
    return _appCommunityPromise
}
getAppCommunity()