import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const functions=source.slice(source.indexOf('function safeUrl'),source.indexOf('function externalLink')).replace('export function','function');
const context=vm.createContext({URL}); vm.runInContext(functions,context);
const valid=[['bilibili','https://www.bilibili.com/video/BV1KXKw6TEkf'],['weibo','https://weibo.com/7854957897/AbCd123'],['douyin','https://www.douyin.com/video/123456'],['kuaishou','https://www.kuaishou.com/short-video/abc123']];
for(const [platform,url] of valid)assert.equal(context.isPostUrl(url,platform),true);
const config=JSON.parse(readFileSync(new URL('../data/accounts.json',import.meta.url)));
for(const account of config.accounts)for(const [platform,url] of Object.entries(account.links))assert.equal(context.isPostUrl(url,platform),false,'Account home must never become a post');
for(const url of ['javascript:alert(1)','https://evil.test/video/BV123','https://www.bilibili.com.evil.test/video/BV123','https://user:pass@www.bilibili.com/video/BV123'])assert.equal(context.isPostUrl(url,'bilibili'),false);
assert.equal(config.accounts[0].links.bilibili,'https://space.bilibili.com/3546657239075200');
assert.equal(config.accounts.length,new Set(config.accounts.map(a=>a.id)).size);
const data=JSON.parse(readFileSync(new URL('../data/updates.json',import.meta.url)));
assert.equal(data.items.length,0,'Initial feed must contain no fabricated data');
for(const check of Object.values(data.checks)){assert.equal(check.lastSuccessAt,null);assert.equal(check.lastFailureAt,null);}
console.log('PASS: post URL boundaries, all six profile exclusions, preserved Bilibili URL, unique accounts and truthful initial data.');
