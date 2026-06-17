import { useState, useCallback } from 'react'

const FS_KEY = 'ai_builder_fs'
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

function load() {
  try { return JSON.parse(localStorage.getItem(FS_KEY) || '[]') } catch { return [] }
}

function save(fs) {
  localStorage.setItem(FS_KEY, JSON.stringify(fs))
}

export function useFileSystem() {
  const [fs, setFs] = useState(load)
  const [selectedId, setSelectedId] = useState(null)
  const [expandedIds, setExpandedIds] = useState(new Set())

  const commit = useCallback((next) => {
    setFs(next)
    save(next)
  }, [])

  const getChildren = useCallback((parentId, nodes = fs) =>
    nodes
      .filter(n => n.parentId === parentId)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
        return a.name.localeCompare(b.name)
      }),
    [fs]
  )

  const createNode = useCallback((name, type, parentId = null) => {
    const node = {
      id: uid(), name, type, parentId,
      content: type === 'file' ? '' : null,
      createdAt: new Date().toISOString(),
    }
    const next = [...fs, node]
    commit(next)
    if (parentId) setExpandedIds(s => new Set([...s, parentId]))
    setSelectedId(node.id)
    return node
  }, [fs, commit])

  const updateContent = useCallback((id, content) => {
    commit(fs.map(n => n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n))
  }, [fs, commit])

  const renameNode = useCallback((id, name) => {
    commit(fs.map(n => n.id === id ? { ...n, name } : n))
  }, [fs, commit])

  const deleteNode = useCallback((id) => {
    const del = (nid, nodes) => {
      const children = nodes.filter(n => n.parentId === nid)
      let result = nodes.filter(n => n.id !== nid)
      children.forEach(c => { result = del(c.id, result) })
      return result
    }
    commit(del(id, fs))
    if (selectedId === id) setSelectedId(null)
  }, [fs, commit, selectedId])

  const saveFile = useCallback((name, content, parentId = null) => {
    const ex = fs.find(n => n.name === name && n.parentId === parentId && n.type === 'file')
    let node
    if (ex) {
      node = { ...ex, content, updatedAt: new Date().toISOString() }
      commit(fs.map(n => n.id === ex.id ? node : n))
    } else {
      node = { id: uid(), name, type: 'file', parentId, content, createdAt: new Date().toISOString() }
      commit([...fs, node])
    }
    if (parentId) setExpandedIds(s => new Set([...s, parentId]))
    setSelectedId(node.id)
    return node
  }, [fs, commit])

  const toggleExpand = useCallback((id) => {
    setExpandedIds(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  return {
    fs, selectedId, setSelectedId, expandedIds,
    getChildren, createNode, updateContent, renameNode, deleteNode, saveFile, toggleExpand,
  }
}
