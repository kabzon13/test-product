#!/usr/bin/env node
// make setup-check — показывает незакрытые шаги перед деплоем.
// Ничего не меняет, только читает.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

let ok = 0;
let warn = 0;

function pass(msg) {
  ok += 1;
  console.log(`  ✅ ${msg}`);
}
function todo(msg, hint) {
  warn += 1;
  console.log(`  ⚠️  ${msg}`);
  if (hint) console.log(`      → ${hint}`);
}

function has(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore', shell: '/bin/bash' });
    return true;
  } catch {
    return false;
  }
}

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

console.log('\nИнструменты:');
for (const [cmd, hint] of [
  ['docker', 'https://docs.docker.com/get-docker/'],
  ['tofu', 'brew install opentofu'],
  ['gh', 'brew install gh && gh auth login'],
  ['aws', 'brew install awscli (нужен для Spaces-бакета tfstate)'],
  ['pnpm', 'corepack enable'],
]) {
  has(cmd) ? pass(cmd) : todo(`${cmd} не найден`, hint);
}

console.log('\nЛокальная разработка:');
existsSync('.env')
  ? pass('.env существует')
  : todo('.env отсутствует', 'его генерирует CLI; можно скопировать из .env.example');

console.log('\nИнфраструктура:');
existsSync('deploy/backend.hcl')
  ? pass('deploy/backend.hcl (tfstate-бакет) настроен')
  : todo('deploy/backend.hcl отсутствует', 'make infra-bootstrap');

for (const env of ['staging', 'production']) {
  const tfvars = `deploy/environments/${env}.tfvars`;
  if (!existsSync(tfvars)) {
    todo(`${tfvars} отсутствует`);
    continue;
  }
  const content = readFileSync(tfvars, 'utf8');
  /ssh_public_key\s*=\s*"ssh-/.test(content)
    ? pass(`${env}: ssh_public_key задан`)
    : todo(`${env}: нет ssh_public_key`, 'make infra-bootstrap');
  /ssh_allow_ips\s*=\s*\[\s*"/.test(content)
    ? pass(`${env}: ssh_allow_ips задан`)
    : todo(`${env}: ssh_allow_ips пуст — SSH будет закрыт`, `впиши свой IP в ${tfvars}`);
}

console.log('\nGitHub:');
if (has('gh') && sh('gh auth status') !== null) {
  pass('gh авторизован');
  for (const env of ['staging', 'production']) {
    const secrets = sh(`gh secret list --env ${env} 2>/dev/null`) ?? '';
    secrets.includes('DEPLOY_SSH_KEY')
      ? pass(`${env}: DEPLOY_SSH_KEY есть`)
      : todo(`${env}: нет DEPLOY_SSH_KEY`, 'make infra-bootstrap');
    secrets.includes('GHCR_TOKEN')
      ? pass(`${env}: GHCR_TOKEN есть`)
      : todo(
          `${env}: нет GHCR_TOKEN`,
          'токен read:packages → gh secret set GHCR_TOKEN --env ' + env,
        );
  }
} else {
  todo('gh не авторизован', 'gh auth login');
}

console.log('\nДомен:');
for (const env of ['staging', 'production']) {
  const envFile = `deploy/environments/${env}.env`;
  if (!existsSync(envFile)) continue;
  const domain = (readFileSync(envFile, 'utf8').match(/^APP_DOMAIN=(.*)$/m) ?? [])[1] ?? '';
  if (domain) {
    pass(`${env}: домен ${domain}`);
    const secrets = sh(`gh secret list --env ${env} 2>/dev/null`) ?? '';
    secrets.includes('ORIGIN_CERT')
      ? pass(`${env}: ORIGIN_CERT есть`)
      : todo(
          `${env}: домен задан, но нет ORIGIN_CERT/ORIGIN_KEY`,
          'Cloudflare → SSL/TLS → Origin Server → Create Certificate',
        );
  } else {
    todo(
      `${env}: домен не задан — сайт будет доступен по IP с самоподписанным сертификатом`,
      `OAuth-провайдеры без домена работать не будут; домен вписывается в ${envFile}`,
    );
  }
}

console.log(`\nИтог: ${ok} готово, ${warn} осталось.`);
console.log('Пошагово: docs/setup-checklist.md\n');
process.exit(0);
