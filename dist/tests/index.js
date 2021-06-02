"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var chai_1 = require("chai");
var index_1 = __importDefault(require("../test/index"));
describe('index tests', function () {
    it('checking how function work', function () {
        chai_1.expect(index_1["default"]('test')).to.equal('test-static');
    });
});
