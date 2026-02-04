import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'


function calculateLevel(score) {
    if (score <= 5) return 'Low'
    if (score <= 12) return 'Medium'
    if (score <= 18) return 'High'
    return 'Critical'
}

function getMitigationHint(level) {
    const hints = {
        Low: 'Accept / monitor',
        Medium: 'Plan mitigation within 6 months',
        High: 'Prioritize action + compensating controls (NIST PR.AC)',
        Critical: 'Immediate mitigation required + executive reporting'
    }
    return hints[level] || ''
}

function RiskForm({ onRiskAdded }) {
    const [asset, setAsset] = useState('')
    const [threat, setThreat] = useState('')
    const [likelihood, setLikelihood] = useState(3)
    const [impact, setImpact] = useState(3)
    const [submitting, setSubmitting] = useState(false)

    const score = likelihood * impact
    const level = calculateLevel(score)

    async function handleSubmit(e) {
        e.preventDefault()
        if (!asset.trim() || !threat.trim()) return

        setSubmitting(true)
        try {
            const res = await fetch(`${API_URL}/assess-risk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ asset: asset.trim(), threat: threat.trim(), likelihood, impact })
            })
            if (res.ok) {
                setAsset('')
                setThreat('')
                setLikelihood(3)
                setImpact(3)
                onRiskAdded()
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="card">
            <h2 className="card-title">Assess New Risk</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Asset Name</label>
                    <input
                        type="text"
                        value={asset}
                        onChange={(e) => setAsset(e.target.value)}
                        placeholder="e.g., Customer Database"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Threat Description</label>
                    <input
                        type="text"
                        value={threat}
                        onChange={(e) => setThreat(e.target.value)}
                        placeholder="e.g., Unauthorized Access"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Likelihood (1-5)</label>
                    <div className="slider-container">
                        <input
                            type="range"
                            min="1"
                            max="5"
                            value={likelihood}
                            onChange={(e) => setLikelihood(Number(e.target.value))}
                        />
                        <span className="slider-value">{likelihood}</span>
                    </div>
                </div>
                <div className="form-group">
                    <label>Impact (1-5)</label>
                    <div className="slider-container">
                        <input
                            type="range"
                            min="1"
                            max="5"
                            value={impact}
                            onChange={(e) => setImpact(Number(e.target.value))}
                        />
                        <span className="slider-value">{impact}</span>
                    </div>
                </div>
                <div className="preview-box">
                    <div>
                        <div className="preview-label">Preview Score</div>
                        <div className="preview-value">{score}</div>
                    </div>
                    <span className={`level-badge level-${level}`}>{level}</span>
                </div>
                <div className="submit-row">
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Adding...' : 'Add Risk Assessment'}
                    </button>
                </div>
            </form>
        </div>
    )
}

function StatsCards({ risks }) {
    const total = risks.length
    const highCritical = risks.filter(r => r.level === 'High' || r.level === 'Critical').length
    const avgScore = total > 0 ? (risks.reduce((sum, r) => sum + r.score, 0) / total).toFixed(1) : '0.0'

    return (
        <div className="stats-grid">
            <div className="stat-card">
                <div className="stat-label">Total Risks</div>
                <div className="stat-value">{total}</div>
            </div>
            <div className="stat-card">
                <div className="stat-label">High / Critical</div>
                <div className={`stat-value ${highCritical > 0 ? 'danger' : ''}`}>{highCritical}</div>
            </div>
            <div className="stat-card">
                <div className="stat-label">Avg Score</div>
                <div className="stat-value">{avgScore}</div>
            </div>
        </div>
    )
}

function RiskTable({ risks, sortConfig, onSort, filterLevel, onFilterChange }) {
    const sortedRisks = [...risks].sort((a, b) => {
        if (!sortConfig.key) return 0
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]
        if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1
        return 0
    })

    const filteredRisks = filterLevel === 'All'
        ? sortedRisks
        : sortedRisks.filter(r => r.level === filterLevel)

    function handleHeaderClick(key) {
        onSort(key)
    }

    function renderSortIndicator(key) {
        if (sortConfig.key !== key) return <span className="sort-indicator">↕</span>
        return <span className="sort-indicator">{sortConfig.dir === 'asc' ? '↑' : '↓'}</span>
    }

    if (risks.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p>No risks assessed yet</p>
                <p>Add your first risk using the form</p>
            </div>
        )
    }

    return (
        <>
            <div className="filter-row">
                <label>Filter by Level:</label>
                <select value={filterLevel} onChange={(e) => onFilterChange(e.target.value)}>
                    <option value="All">All</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => handleHeaderClick('id')} className={sortConfig.key === 'id' ? 'sorted' : ''}>
                                ID {renderSortIndicator('id')}
                            </th>
                            <th onClick={() => handleHeaderClick('asset')} className={sortConfig.key === 'asset' ? 'sorted' : ''}>
                                Asset {renderSortIndicator('asset')}
                            </th>
                            <th onClick={() => handleHeaderClick('threat')} className={sortConfig.key === 'threat' ? 'sorted' : ''}>
                                Threat {renderSortIndicator('threat')}
                            </th>
                            <th onClick={() => handleHeaderClick('likelihood')} className={sortConfig.key === 'likelihood' ? 'sorted' : ''}>
                                Likelihood {renderSortIndicator('likelihood')}
                            </th>
                            <th onClick={() => handleHeaderClick('impact')} className={sortConfig.key === 'impact' ? 'sorted' : ''}>
                                Impact {renderSortIndicator('impact')}
                            </th>
                            <th onClick={() => handleHeaderClick('score')} className={sortConfig.key === 'score' ? 'sorted' : ''}>
                                Score {renderSortIndicator('score')}
                            </th>
                            <th>Level</th>
                            <th>Mitigation Hint</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRisks.map(risk => (
                            <tr key={risk.id}>
                                <td>{risk.id}</td>
                                <td>{risk.asset}</td>
                                <td>{risk.threat}</td>
                                <td>{risk.likelihood}</td>
                                <td>{risk.impact}</td>
                                <td>{risk.score}</td>
                                <td><span className={`level-badge level-${risk.level}`}>{risk.level}</span></td>
                                <td><span className="mitigation-hint">{getMitigationHint(risk.level)}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}

function Heatmap({ risks }) {
    const [hoveredCell, setHoveredCell] = useState(null)

    const matrix = {}
    for (let l = 1; l <= 5; l++) {
        for (let i = 1; i <= 5; i++) {
            matrix[`${l}-${i}`] = []
        }
    }

    risks.forEach(risk => {
        const key = `${risk.likelihood}-${risk.impact}`
        if (matrix[key]) {
            matrix[key].push(risk.asset)
        }
    })

    function getCellLevel(likelihood, impact) {
        const score = likelihood * impact
        return calculateLevel(score)
    }

    return (
        <div className="card heatmap-container">
            <div className="heatmap-title">Risk Matrix (5x5)</div>
            <div className="heatmap-wrapper">
                <div className="y-axis-label">Likelihood</div>
                <div className="heatmap-y-labels">
                    {[5, 4, 3, 2, 1].map(l => (
                        <div key={l} className="heatmap-y-label">{l}</div>
                    ))}
                </div>
                <div className="heatmap-main">
                    <div className="heatmap-x-labels">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="heatmap-x-label">{i}</div>
                        ))}
                    </div>
                    <div className="heatmap-grid">
                        {[5, 4, 3, 2, 1].map(likelihood =>
                            [1, 2, 3, 4, 5].map(impact => {
                                const key = `${likelihood}-${impact}`
                                const assets = matrix[key]
                                const level = getCellLevel(likelihood, impact)
                                const isHovered = hoveredCell === key

                                return (
                                    <div
                                        key={key}
                                        className={`heatmap-cell level-${level}`}
                                        onMouseEnter={() => setHoveredCell(key)}
                                        onMouseLeave={() => setHoveredCell(null)}
                                    >
                                        {assets.length}
                                        {isHovered && assets.length > 0 && (
                                            <div className="tooltip">
                                                <div className="tooltip-header">
                                                    {assets.length} risk{assets.length > 1 ? 's' : ''} at L{likelihood}/I{impact}
                                                </div>
                                                <ul className="tooltip-assets">
                                                    {assets.slice(0, 5).map((a, idx) => (
                                                        <li key={idx}>{a}</li>
                                                    ))}
                                                    {assets.length > 5 && <li>...and {assets.length - 5} more</li>}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                    <div className="axis-label">Impact</div>
                </div>
            </div>
        </div>
    )
}

function Dashboard({ risks, loading }) {
    const [sortConfig, setSortConfig] = useState({ key: 'score', dir: 'desc' })
    const [filterLevel, setFilterLevel] = useState('All')

    function handleSort(key) {
        setSortConfig(prev => ({
            key,
            dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc'
        }))
    }

    function exportCSV() {
        const headers = ['ID', 'Asset', 'Threat', 'Likelihood', 'Impact', 'Score', 'Level']
        const rows = risks.map(r => [r.id, r.asset, r.threat, r.likelihood, r.impact, r.score, r.level])
        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'risks.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <p>Loading risks...</p>
            </div>
        )
    }

    return (
        <div>
            <StatsCards risks={risks} />
            <div className="dashboard-grid">
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 className="card-title" style={{ marginBottom: 0 }}>Risk Register</h2>
                        <button className="btn btn-secondary" onClick={exportCSV} disabled={risks.length === 0}>
                            Export CSV
                        </button>
                    </div>
                    <RiskTable
                        risks={risks}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        filterLevel={filterLevel}
                        onFilterChange={setFilterLevel}
                    />
                </div>
                <Heatmap risks={risks} />
            </div>
        </div>
    )
}

function App() {
    const [risks, setRisks] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchRisks = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/risks`)
            if (res.ok) {
                const data = await res.json()
                setRisks(data)
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchRisks()
    }, [fetchRisks])

    return (
        <div className="container">
            <header className="header">
                <h1>GRC Risk Assessment Dashboard</h1>
            </header>
            <main className="main-grid">
                <RiskForm onRiskAdded={fetchRisks} />
                <Dashboard risks={risks} loading={loading} />
            </main>
        </div>
    )
}

export default App
