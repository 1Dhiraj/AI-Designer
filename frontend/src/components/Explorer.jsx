import { useState, useRef } from 'react'
import { Plus, FileIcon, FolderIcon, ChevronRight } from './Icons'
import styles from './Explorer.module.css'

const FILE_COLORS = { html: '#F05A1A', css: '#5B8DEF', js: '#F0C01A' }

function fileColor(name) {
  const ext = name.split('.').pop()
  return FILE_COLORS[ext] || '#AAAAAA'
}

function TreeNode({ node, depth, selectedId, expandedIds, getChildren, onSelect, onToggle, onRename, onDelete, onNewFile, onNewFolder }) {
  const isFolder = node.type === 'folder'
  const expanded = expandedIds.has(node.id)
  const selected = node.id === selectedId
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(node.name)
  const inputRef = useRef()

  const startEdit = (e) => { e.stopPropagation(); setEditVal(node.name); setEditing(true); setTimeout(() => inputRef.current?.select(), 30) }
  const finishEdit = () => { if (editVal.trim() && editVal !== node.name) onRename(node.id, editVal.trim()); setEditing(false) }

  const handleCtx = (e) => {
    e.preventDefault()
    // simple right-click menu via native confirm for now
    const action = window.prompt(`Actions for "${node.name}":\n1 = Rename\n2 = Delete${isFolder ? '\n3 = New File Here\n4 = New Folder Here' : ''}`)
    if (action === '1') startEdit(e)
    if (action === '2') { if (confirm(`Delete "${node.name}"?`)) onDelete(node.id) }
    if (action === '3' && isFolder) onNewFile(node.id)
    if (action === '4' && isFolder) onNewFolder(node.id)
  }

  return (
    <div className={styles.node}>
      <div
        className={`${styles.row} ${selected ? styles.selected : ''}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => isFolder ? onToggle(node.id) : onSelect(node.id)}
        onDoubleClick={startEdit}
        onContextMenu={handleCtx}
      >
        <span className={`${styles.toggle} ${expanded ? styles.open : ''}`}>
          {isFolder ? <ChevronRight /> : null}
        </span>
        <span className={styles.icon} style={{ color: isFolder ? '#F0C01A' : fileColor(node.name) }}>
          {isFolder ? <FolderIcon /> : <FileIcon />}
        </span>
        {editing ? (
          <input
            ref={inputRef}
            className={styles.nameInput}
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onBlur={finishEdit}
            onKeyDown={e => { if (e.key === 'Enter') finishEdit(); if (e.key === 'Escape') { setEditVal(node.name); setEditing(false) } }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={styles.name}>{node.name}</span>
        )}
      </div>
      {isFolder && expanded && getChildren(node.id).map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1}
          selectedId={selectedId} expandedIds={expandedIds} getChildren={getChildren}
          onSelect={onSelect} onToggle={onToggle} onRename={onRename} onDelete={onDelete}
          onNewFile={onNewFile} onNewFolder={onNewFolder}
        />
      ))}
    </div>
  )
}

export default function Explorer({ fs, selectedId, expandedIds, getChildren, onSelect, onToggle, onCreate, onRename, onDelete }) {
  const prompt = (type, parentId = null) => {
    const name = window.prompt(type === 'folder' ? 'Folder name:' : 'File name:', type === 'file' ? 'untitled.html' : 'New Folder')
    if (name?.trim()) onCreate(name.trim(), type, parentId)
  }

  const roots = getChildren(null)

  return (
    <div className={styles.explorer}>
      <div className={styles.head}>
        <span className={styles.title}>Files</span>
        <button className={styles.btn} title="New File" onClick={() => prompt('file')}><Plus /><FileIcon /></button>
        <button className={styles.btn} title="New Folder" onClick={() => prompt('folder')}><Plus /><FolderIcon /></button>
      </div>
      <div className={styles.tree}>
        {roots.length === 0 ? (
          <div className={styles.empty}>No files yet.<br />Click + to get started.</div>
        ) : roots.map(node => (
          <TreeNode key={node.id} node={node} depth={0}
            selectedId={selectedId} expandedIds={expandedIds} getChildren={getChildren}
            onSelect={onSelect} onToggle={onToggle} onRename={onRename} onDelete={onDelete}
            onNewFile={(pid) => prompt('file', pid)} onNewFolder={(pid) => prompt('folder', pid)}
          />
        ))}
      </div>
    </div>
  )
}
