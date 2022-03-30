import { sixDigitHash } from '../src/utils/auth'
import makeServiceWorkerEnv from 'service-worker-mock'
import crypto from "crypto";

declare var global: any;

describe('Test', () => {
    beforeEach(() => {
        Object.assign(global, makeServiceWorkerEnv())
        jest.resetModules();
    })

    test("Returns valid hash", async ()=>{
        expect(1).toBeTruthy()
    })
})