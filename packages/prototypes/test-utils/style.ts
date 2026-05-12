export function styleContains(el: Element, token: string): boolean {
  return (el.getAttribute('data-pui-style') ?? '').split(/\s+/).includes(token);
}
