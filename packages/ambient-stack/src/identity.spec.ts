import 'mocha'
import { expect } from 'chai'
import { Database } from './database'
import crypto from 'crypto'
import { register } from './identity'

describe("identity", () => {

    it('registers', async () => {
        const username = crypto.randomBytes(20).toString('hex');
        const namespace = Buffer.from("hi")

        let user = await register(username, "password", namespace)
        expect(user).to.not.be.undefined

        // now try to register the same user
        try {
            let user2 = await register(username, "password", namespace)
            expect(user2).to.be.undefined
        } catch(e) {
            expect(e.message).to.equal("user already exists")
        }
    })

})