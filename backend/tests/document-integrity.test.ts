import type { Request, Response } from "express";
import { jest } from "@jest/globals";
const findCustomer = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const findEvent = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const findQuote = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const findInvoice = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const transaction = jest.fn();
const create = jest.fn();
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ default: {
  customer: { findUnique: findCustomer }, event: { findUnique: findEvent },
  quote: { findUnique: findQuote, create }, invoice: { findUnique: findInvoice }, $transaction: transaction,
} }));
const { createQuote, updateQuote } = await import("../src/controllers/quote.controller.js");
const { updateInvoice } = await import("../src/controllers/invoice.controller.js");
const A="11111111-1111-4111-8111-111111111111", B="22222222-2222-4222-8222-222222222222", E="33333333-3333-4333-8333-333333333333";
function response() { const json=jest.fn();const status=jest.fn(()=>({json}));return {res:{status,json} as unknown as Response,status,json}; }
beforeEach(()=>{jest.clearAllMocks();findCustomer.mockResolvedValue({id:A});findEvent.mockResolvedValue({id:E,customerId:B});findQuote.mockResolvedValue({id:E,customerId:A,eventId:E,items:[],tax:19,discount:0,subtotal:0,total:0,status:"DRAFT"});findInvoice.mockResolvedValue({id:E,customerId:A,eventId:null,quoteId:null,status:"DRAFT",items:[],issueDate:new Date("2026-11-10"),dueDate:new Date("2026-11-20")});});
it("rejects a quote linked to another customer's event before inserting",async()=>{const r=response();await createQuote({body:{quoteNo:"Q-1",customerId:A,eventId:E,items:[{type:"SERVICE",description:"Test",quantity:1,unitPrice:10}]}} as Request,r.res);expect(r.status).toHaveBeenCalledWith(400);expect(create).not.toHaveBeenCalled();});
it("rejects changing only a quote customer when its existing event belongs elsewhere",async()=>{findEvent.mockResolvedValue({id:E,customerId:A});const r=response();await updateQuote({params:{id:E},body:{customerId:B}} as unknown as Request,r.res);expect(r.status).toHaveBeenCalledWith(400);expect(transaction).not.toHaveBeenCalled();});
it("rejects changing only a quote event when its customer differs",async()=>{const r=response();await updateQuote({params:{id:E},body:{eventId:E}} as unknown as Request,r.res);expect(r.status).toHaveBeenCalledWith(400);expect(transaction).not.toHaveBeenCalled();});
it.each([{dueDate:"2026-11-09"},{issueDate:"2026-11-21"}])("checks partial invoice date updates against retained dates: %j",async body=>{const r=response();await updateInvoice({params:{id:E},body} as unknown as Request,r.res);expect(r.status).toHaveBeenCalledWith(400);expect(r.json).toHaveBeenCalledWith({error:"Due date must not be before issue date"});expect(transaction).not.toHaveBeenCalled();});
it("rejects invoice customer changes that invalidate the retained event",async()=>{findInvoice.mockResolvedValue({id:E,customerId:A,eventId:E,status:"DRAFT",items:[]});findEvent.mockResolvedValue({id:E,customerId:A});const r=response();await updateInvoice({params:{id:E},body:{customerId:B}} as unknown as Request,r.res);expect(r.status).toHaveBeenCalledWith(400);expect(transaction).not.toHaveBeenCalled();});
it.each([{}, {quoteId:E}])("rejects invoice customer changes that invalidate retained quotes %j",async extra=>{findInvoice.mockResolvedValue({id:E,customerId:A,eventId:null,quoteId:E,status:"DRAFT",items:[]});const r=response();await updateInvoice({params:{id:E},body:{customerId:B,...extra}} as unknown as Request,r.res);expect(r.status).toHaveBeenCalledWith(400);expect(transaction).not.toHaveBeenCalled();});
