export default async function ({locale, requestLocale}: {locale?: string; requestLocale?: string | Promise<string | undefined>}) {
  const resolvedLocale = locale || (await requestLocale) || 'zh';
  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
  };
}
