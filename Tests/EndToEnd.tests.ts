// import http = require("http");
// import https = require("https");
// import assert = require("assert");
// import path = require("path")
// import os = require("os")
// import fs = require('fs');
// import nock = require("nock");
// import sinon = require("sinon");
// import events = require("events");
// import child_process = require("child_process");
// import AppInsights = require("../applicationinsights");
// import Sender = require("../Library/Sender");
// import Traceparent = require("../Library/Traceparent");
// import { EventEmitter } from "events";
// import { CorrelationContextManager } from "../AutoCollection/CorrelationContextManager";
// import { TelemetryItem } from "../generated";
// import { DEFAULT_BREEZE_ENDPOINT } from "../Declarations/Constants";
// import HeartBeat = require("../AutoCollection/HeartBeat");
// import TelemetryClient = require("../Library/TelemetryClient");
// import Context = require("../Library/Context");



// /**
//  * A fake response class that passes by default
//  */
// class fakeResponse {
//     private callbacks: { [event: string]: (data?: any) => void } = Object.create(null);
//     public setEncoding(): void { };
//     public statusCode: number = 200;
//     private _responseData: any;

//     constructor(private passImmediately: boolean = true, responseData?: any) {
//         this._responseData = responseData ? responseData : "data";
//     }

//     public on(event: string, callback: () => void) {
//         if (!this.callbacks[event]) {
//             this.callbacks[event] = callback;
//         } else {
//             var lastCallback = this.callbacks[event];
//             this.callbacks[event] = () => {
//                 callback();
//                 lastCallback();
//             };
//         }

//         if (event == "end" && this.passImmediately) {
//             this.pass(true);
//         }
//     }

//     public emit(eventName: string, ...args: any[]): boolean {
//         return true;
//     }

//     public addListener(eventName: string, listener: () => void): void {
//         this.on(eventName, listener);
//     }

//     public removeListener(eventName: string, listener: () => void) {

//     }

//     public pass(test = false): void {
//         this.callbacks["data"] ? this.callbacks["data"](this._responseData) : null;
//         this.callbacks["end"] ? this.callbacks["end"]() : null;
//         this.callbacks["finish"] ? this.callbacks["finish"]() : null;
//     }

//     public end = this.pass;
//     public once = this.on;
// }

// /**
//  * A fake request class that fails by default
//  */
// class fakeRequest {
//     private callbacks: { [event: string]: Function } = Object.create(null);
//     public write(): void { }
//     public headers: { [id: string]: string } = {};
//     public agent = { protocol: 'http' };
//     private _responseData: any;

//     constructor(private failImmediatly: boolean = true, public url: string = undefined, responseData?: any) {
//         this._responseData = responseData;
//     }

//     public on(event: string, callback: Function) {
//         this.callbacks[event] = callback;
//         if (event === "error" && this.failImmediatly) {
//             setImmediate(() => this.fail());
//         }
//     }

//     public emit(eventName: string, ...args: any[]): boolean {
//         return true;
//     }

//     public addListener(eventName: string, listener: Function): void {
//         this.on(eventName, listener);
//     }

//     public removeListener(eventName: string, listener?: Function) {

//     }

//     public fail(): void {
//         this.callbacks["error"] ? this.callbacks["error"]() : null;
//     }

//     public end(): void {
//         this.callbacks["end"] ? this.callbacks["end"](new fakeResponse(true, this._responseData)) : null;
//     }
// }

// /**
//  * A fake http server
//  */
// class fakeHttpServer extends events.EventEmitter {
//     public setCallback(callback: any) {
//         this.on("request", callback);
//     }

//     public listen(port: any, host?: any, backlog?: any, callback?: any) {
//         this.emit("listening");
//     }

//     public emitRequest(url: string) {
//         var request = new fakeRequest(false, url);
//         var response = new fakeResponse(false);
//         this.emit("request", request, response);
//         request.end();
//     }
// }

// /**
//  * A fake https server class that doesn't require ssl certs
//  */
// class fakeHttpsServer extends events.EventEmitter {

//     public setCallback(callback: any) {
//         this.on("request", callback);
//     }

//     public listen(port: any, host?: any, backlog?: any, callback?: any) {
//         this.emit("listening");
//     }

//     public emitRequest(url: string) {
//         var request = new fakeRequest(false, url);
//         var response = new fakeResponse(false);
//         this.emit("request", request, response);
//         request.end();
//         response.pass();
//     }
// }

// describe("EndToEnd", () => {
//     var sandbox: sinon.SinonSandbox;
//     var requestStub: sinon.SinonStub;
//     let ingest: TelemetryItem[] = [];
//     nock(DEFAULT_BREEZE_ENDPOINT)
//         .post("/v2/track", (body: TelemetryItem[]) => {
//             ingest.push(...body);
//             return true;
//         })
//         .reply(200, {
//             itemsAccepted: 1,
//             itemsReceived: 1,
//             errors: []
//         })
//         .persist();

//     beforeEach(() => {
//         sandbox = sinon.sandbox.create();
//     });

//     after(() => {
//         nock.cleanAll();
//         if (requestStub) {
//             requestStub.restore();
//         }

//     });

//     describe("Basic usage", () => {
//         afterEach(() => {
//             // Dispose the default app insights client and auto collectors so that they can be reconfigured
//             // cleanly for each test
//             CorrelationContextManager.reset();
//             AppInsights.dispose();
//             sandbox.restore();
//         });

//         it("should send telemetry", (done) => {
//             const expectedTelemetryData: AppInsights.Contracts.AvailabilityTelemetry = {
//                 duration: 100, id: "id1", message: "message1", success: true, name: "name1", runLocation: "east us"
//             };

//             var client = new AppInsights.TelemetryClient("1aa11111-bbbb-1ccc-8ddd-eeeeffff3333");
//             client.trackEvent({ name: "test event" });
//             client.trackException({ exception: new Error("test error") });
//             client.trackMetric({ name: "test metric", value: 3 });
//             client.trackTrace({ message: "test trace" });
//             client.trackAvailability(expectedTelemetryData);
//             client.flush({
//                 callback: (response: any) => {
//                     assert.ok(response, "response should not be empty");
//                     assert.ok(response !== "no data to send", "response should have data");
//                     done();
//                 }
//             });
//         });

//         it("should collect http request telemetry", (done) => {
//             var fakeHttpSrv = new fakeHttpServer();
//             sandbox.stub(http, 'createServer', (callback: (req: http.ServerRequest, res: http.ServerResponse) => void) => {
//                 fakeHttpSrv.setCallback(callback);
//                 return fakeHttpSrv;
//             });
//             AppInsights
//                 .setup("ikey")
//                 .setAutoCollectRequests(true)
//                 .setUseDiskRetryCaching(false)
//                 .start();
//             var track = sandbox.stub(AppInsights.defaultClient, 'track');
//             http.createServer((req, res) => {
//                 assert.equal(track.callCount, 0);
//                 res.end();
//                 assert.equal(track.callCount, 1);
//                 done();
//             });

//             fakeHttpSrv.emitRequest("http://localhost:0/test");
//         });

//         it("should collect https request telemetry", (done) => {
//             var fakeHttpSrv = new fakeHttpServer();
//             sandbox.stub(https, 'createServer', (options: any, callback: (req: http.ServerRequest, res: http.ServerResponse) => void) => {
//                 fakeHttpSrv.setCallback(callback);
//                 return fakeHttpSrv;
//             });
//             AppInsights
//                 .setup("ikey")
//                 .setUseDiskRetryCaching(false)
//                 .setAutoCollectRequests(true)
//                 .start();

//             var track = sandbox.stub(AppInsights.defaultClient, 'track');
//             https.createServer(null, (req: http.ServerRequest, res: http.ServerResponse) => {
//                 assert.equal(track.callCount, 0);
//                 res.end();
//                 assert.equal(track.callCount, 1);
//                 done();
//             });

//             fakeHttpSrv.emitRequest("http://localhost:0/test");
//         });

//         it("should collect http dependency telemetry", (done) => {
//             var eventEmitter = new EventEmitter();
//             (<any>eventEmitter).method = "GET";
//             sandbox.stub(http, 'request', (url: string, c: Function) => {
//                 process.nextTick(c);
//                 return eventEmitter;
//             });

//             AppInsights
//                 .setup("ikey")
//                 .setUseDiskRetryCaching(false)
//                 .setAutoCollectDependencies(true)
//                 .start();

//             var track = sandbox.stub(AppInsights.defaultClient, 'track');

//             http.request(<any>'http://test.com', (c) => {
//                 assert.equal(track.callCount, 0);
//                 eventEmitter.emit("response", {});
//                 assert.equal(track.callCount, 1);
//                 done();
//             });
//         });

//         it("should collect https dependency telemetry", (done) => {
//             var eventEmitter = new EventEmitter();
//             (<any>eventEmitter).method = "GET";
//             sandbox.stub(https, 'request', (url: string, c: Function) => {
//                 process.nextTick(c);
//                 return eventEmitter;
//             });

//             AppInsights
//                 .setup("ikey")
//                 .setUseDiskRetryCaching(false)
//                 .setAutoCollectDependencies(true)
//                 .start();

//             var track = sandbox.stub(AppInsights.defaultClient, 'track');

//             https.request(<any>'https://test.com', (c) => {
//                 assert.equal(track.callCount, 0);
//                 eventEmitter.emit("response", {});
//                 assert.equal(track.callCount, 1);
//                 done();
//             });
//         });
//     });

//     describe("W3C mode", () => {
//         var sandbox: sinon.SinonSandbox;

//         beforeEach(() => {
//             sandbox = sinon.sandbox.create();
//         });

//         afterEach(() => {
//             // Dispose the default app insights client and auto collectors so that they can be reconfigured
//             // cleanly for each test
//             CorrelationContextManager.reset();
//             AppInsights.dispose();
//             sandbox.restore();
//         });

//         it("should pass along traceparent/tracestate header if present in current operation", (done) => {
//             var eventEmitter = new EventEmitter();
//             (eventEmitter as any).headers = {};
//             (eventEmitter as any)["getHeader"] = function (name: string) { return this.headers[name]; };
//             (eventEmitter as any)["setHeader"] = function (name: string, value: string) { this.headers[name] = value; };
//             (<any>eventEmitter).method = "GET";
//             sandbox.stub(https, 'request', (url: string, c: Function) => {
//                 process.nextTick(c);
//                 return eventEmitter;
//             });

//             AppInsights
//                 .setup("ikey")
//                 .setUseDiskRetryCaching(false)
//                 .setAutoCollectDependencies(true)
//                 .start();

//             sandbox.stub(CorrelationContextManager, "getCurrentContext", () => ({
//                 operation: {
//                     traceparent: new Traceparent("00-5e84aff3af474588a42dcbf3bd1db95f-1fc066fb77fa43a3-00"),
//                     tracestate: "sometracestate"
//                 },
//                 customProperties: {
//                     serializeToHeader: (): null => null
//                 }
//             }));
//             https.request(<any>'https://test.com', (c) => {
//                 eventEmitter.emit("response", {});
//                 assert.ok((eventEmitter as any).headers["request-id"].match(/^\|[0-z]{32}\.[0-z]{16}\./g));
//                 assert.ok((eventEmitter as any).headers.traceparent.match(/^00-5e84aff3af474588a42dcbf3bd1db95f-[0-z]{16}-00$/));
//                 assert.notEqual((eventEmitter as any).headers.traceparent, "00-5e84aff3af474588a42dcbf3bd1db95f-1fc066fb77fa43a3-00");
//                 assert.equal((eventEmitter as any).headers.tracestate, "sometracestate");
//                 AppInsights.defaultClient.flush();
//                 done();
//             });
//         });

//         it("should create and pass a traceparent header if w3c is enabled", (done) => {
//             var CorrelationIdManager = require("../Library/CorrelationIdManager");

//             var eventEmitter = new EventEmitter();
//             (eventEmitter as any).headers = {};
//             (eventEmitter as any)["getHeader"] = function (name: string) { return this.headers[name]; };
//             (eventEmitter as any)["setHeader"] = function (name: string, value: string) { this.headers[name] = value; };
//             (<any>eventEmitter).method = "GET";
//             sandbox.stub(https, 'request', (url: string, c: Function) => {
//                 process.nextTick(c);
//                 return eventEmitter;
//             });

//             AppInsights
//                 .setup("ikey")
//                 .setUseDiskRetryCaching(false)
//                 .setAutoCollectDependencies(true)
//                 .start();

//             CorrelationIdManager.w3cEnabled = true;

//             sandbox.stub(CorrelationContextManager, "getCurrentContext", () => ({
//                 operation: {
//                 },
//                 customProperties: {
//                     serializeToHeader: (): null => null
//                 }
//             }));
//             https.request(<any>'https://test.com', (c) => {
//                 eventEmitter.emit("response", {});
//                 assert.ok((eventEmitter as any).headers.traceparent.match(/^00-[0-z]{32}-[0-z]{16}-[0-9a-f]{2}/g), "traceparent header is passed, 00-W3C-W3C-00");
//                 assert.ok((eventEmitter as any).headers["request-id"].match(/^\|[0-z]{32}\.[0-z]{16}\./g), "back compat header is also passed, |W3C.W3C." + (eventEmitter as any).headers["request-id"]);
//                 CorrelationIdManager.w3cEnabled = false;
//                 AppInsights.defaultClient.flush();
//                 done();
//             });
//         });
//     });

//     // describe("Heartbeat metrics for VM", () => {
//     //     var sandbox: sinon.SinonSandbox;

//     //     beforeEach(() => {
//     //         sandbox = sinon.sandbox.create();
//     //     });

//     //     afterEach(() => {
//     //         sandbox.restore();
//     //     });

//     //     it("should collect correct VM information from JSON response", (done) => {
//     //         // set up stub
//     //         const vmDataJSON = `{
//     //             "vmId": "1",
//     //             "subscriptionId": "2",
//     //             "osType": "Windows_NT"
//     //         }`;
//     //         var stub: sinon.SinonStub = sandbox.stub(http, "request", (options: any, callback: any) => {
//     //             var req = new fakeRequest(false, "http://169.254.169.254", vmDataJSON);
//     //             req.on("end", callback);
//     //             return req;
//     //         });

//     //         // set up sdk
//     //         const client = new TelemetryClient("key");
//     //         const heartbeat: HeartBeat = new HeartBeat(client);
//     //         heartbeat.enable(true, client.config);
//     //         HeartBeat.INSTANCE.enable(true, client.config);
//     //         const trackMetricStub = sinon.stub(heartbeat["_client"], "trackMetric");

//     //         heartbeat["trackHeartBeat"](client.config, () => {
//     //             assert.equal(trackMetricStub.callCount, 1, "should call trackMetric for the VM heartbeat metric");
//     //             assert.equal(trackMetricStub.args[0][0].name, "HeartBeat", "should use correct name for heartbeat metric");
//     //             assert.equal(trackMetricStub.args[0][0].value, 0, "value should be 0");
//     //             const keys = Object.keys(trackMetricStub.args[0][0].properties);
//     //             assert.equal(keys.length, 5, "should have 4 kv pairs added when resource type is VM");
//     //             assert.equal(keys[0], "sdk", "sdk should be added as a key");
//     //             assert.equal(keys[1], "osType", "osType should be added as a key");
//     //             assert.equal(keys[2], "azInst_vmId", "azInst_vmId should be added as a key");
//     //             assert.equal(keys[3], "azInst_subscriptionId", "azInst_subscriptionId should be added as a key");
//     //             assert.equal(keys[4], "azInst_osType", "azInst_osType should be added as a key");

//     //             const properties = trackMetricStub.args[0][0].properties;
//     //             assert.equal(properties["sdk"], Context.sdkVersion, "sdk version should be read from Context");
//     //             assert.equal(properties["osType"], os.type(), "osType should be read from os library");
//     //             assert.equal(properties["azInst_vmId"], "1", "azInst_vmId should be read from response");
//     //             assert.equal(properties["azInst_subscriptionId"], "2", "azInst_subscriptionId should be read from response");
//     //             assert.equal(properties["azInst_osType"], "Windows_NT", "azInst_osType should be read from response");
//     //             trackMetricStub.restore();
//     //             heartbeat.dispose();
//     //             stub.restore();
//     //             done();
//     //         });
//     //     });

//     //     it("should only send name and value properties for heartbeat metric when get VM request fails", (done) => {
//     //         // set up stub
//     //         var stub: sinon.SinonStub = sandbox.stub(http, "request", (options: any, callback: any) => {
//     //             var req = new fakeRequest(true, "http://169.254.169.254");
//     //             return req;
//     //         });
//     //         // set up sdk
//     //         const client = new TelemetryClient("key");
//     //         const heartbeat: HeartBeat = new HeartBeat(client);
//     //         heartbeat.enable(true, client.config);
//     //         HeartBeat.INSTANCE.enable(true, client.config);
//     //         const trackMetricStub = sinon.stub(heartbeat["_client"], "trackMetric");

//     //         heartbeat["trackHeartBeat"](client.config, () => {
//     //             assert.equal(trackMetricStub.callCount, 1, "should call trackMetric as heartbeat metric");
//     //             assert.equal(trackMetricStub.args[0][0].name, "HeartBeat", "should use correct name for heartbeat metric");
//     //             assert.equal(trackMetricStub.args[0][0].value, 0, "value should be 0");
//     //             const keys = Object.keys(trackMetricStub.args[0][0].properties);
//     //             assert.equal(keys.length, 2, "should have 2 kv pairs added when resource type is not web app, not function app, not VM");
//     //             assert.equal(keys[0], "sdk", "sdk should be added as a key");
//     //             assert.equal(keys[1], "osType", "osType should be added as a key");

//     //             const properties = trackMetricStub.args[0][0].properties;
//     //             assert.equal(properties["sdk"], Context.sdkVersion, "sdk version should be read from Context");
//     //             assert.equal(properties["osType"], os.type(), "osType should be read from os library");
//     //             trackMetricStub.restore();
//     //             heartbeat.dispose();
//     //             stub.restore();
//     //             done();
//     //         });
//     //     });
//     // });
// });
