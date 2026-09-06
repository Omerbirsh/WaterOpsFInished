import { useLayoutEffect, type ReactNode } from "react"
import { translateToHebrew } from "../lib/hebrew"
import { useLanguage } from "../state/LanguageContext"

const originalText = new WeakMap<Text, string>()
const originalAttributes = new WeakMap<Element, Map<string, string>>()
const translatedAttributes = ["aria-label", "aria-description", "placeholder", "title"]

function updateTextNode(node: Text, hebrew: boolean, restoring = false) {
  const current = node.data
  let original = originalText.get(node)

  if (!hebrew) {
    if (restoring && original !== undefined) {
      if (node.data !== original) node.data = original
    } else {
      originalText.set(node, current)
    }
    return
  }

  if (original === undefined) {
    original = current
    originalText.set(node, original)
  } else if (hebrew && current !== original && current !== translateToHebrew(original)) {
    original = current
    originalText.set(node, original)
  }

  const next = translateToHebrew(original)
  if (node.data !== next) node.data = next
}

function updateElement(element: Element, hebrew: boolean, restoring = false) {
  let originals = originalAttributes.get(element)
  if (!originals) {
    originals = new Map<string, string>()
    originalAttributes.set(element, originals)
  }

  for (const attribute of translatedAttributes) {
    const current = element.getAttribute(attribute)
    if (current === null) continue
    let original = originals.get(attribute)
    if (!hebrew) {
      if (restoring && original !== undefined) {
        if (current !== original) element.setAttribute(attribute, original)
      } else {
        originals.set(attribute, current)
      }
      continue
    }
    if (original === undefined) {
      original = current
      originals.set(attribute, original)
    } else if (hebrew && current !== original && current !== translateToHebrew(original)) {
      original = current
      originals.set(attribute, original)
    }
    const next = translateToHebrew(original)
    if (current !== next) element.setAttribute(attribute, next)
  }
}

function updateTree(root: Node, hebrew: boolean, restoring = false) {
  if (root.nodeType === Node.TEXT_NODE) {
    updateTextNode(root as Text, hebrew, restoring)
    return
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return

  if (root.nodeType === Node.ELEMENT_NODE) updateElement(root as Element, hebrew, restoring)
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) updateTextNode(node as Text, hebrew, restoring)
    else updateElement(node as Element, hebrew, restoring)
    node = walker.nextNode()
  }
}

export function LocalizationBoundary({ children }: { children: ReactNode }) {
  const { language } = useLanguage()

  useLayoutEffect(() => {
    const hebrew = language === "he"
    updateTree(document.body, hebrew, !hebrew)
    document.title = hebrew ? "WaterOps — ניהול שירות" : "WaterOps — Service Review"

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") updateTextNode(mutation.target as Text, hebrew)
        if (mutation.type === "attributes") updateElement(mutation.target as Element, hebrew)
        mutation.addedNodes.forEach((node) => updateTree(node, hebrew))
      }
    })
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: translatedAttributes,
    })
    return () => observer.disconnect()
  }, [language])

  return children
}
