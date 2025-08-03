#!/usr/bin/env python3

"""
Analyze and visualize Creative Thinking telemetry data
"""

import json
import sys
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

def load_telemetry_data(filepath):
    """Load telemetry export JSON"""
    with open(filepath, 'r') as f:
        return json.load(f)

def analyze_effectiveness(data):
    """Analyze technique effectiveness"""
    effectiveness = pd.DataFrame(data['effectiveness'])
    
    # Create figure with subplots
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('Creative Thinking Technique Analysis', fontsize=16)
    
    # 1. Effectiveness scores
    ax1 = axes[0, 0]
    effectiveness_sorted = effectiveness.sort_values('averageEffectiveness', ascending=True)
    ax1.barh(effectiveness_sorted['technique'], effectiveness_sorted['averageEffectiveness'])
    ax1.set_xlabel('Average Effectiveness')
    ax1.set_title('Technique Effectiveness Scores')
    ax1.set_xlim(0, 1)
    
    # 2. Completion rates
    ax2 = axes[0, 1]
    ax2.pie(effectiveness['completionRate'], 
            labels=effectiveness['technique'], 
            autopct='%1.1f%%')
    ax2.set_title('Completion Rates by Technique')
    
    # 3. Insights vs Risks
    ax3 = axes[1, 0]
    x = effectiveness['averageInsights']
    y = effectiveness['averageRisks']
    ax3.scatter(x, y, s=effectiveness['usageCount']*10, alpha=0.6)
    for i, txt in enumerate(effectiveness['technique']):
        ax3.annotate(txt, (x[i], y[i]), fontsize=8)
    ax3.set_xlabel('Average Insights')
    ax3.set_ylabel('Average Risks Identified')
    ax3.set_title('Insights vs Risks (bubble size = usage count)')
    
    # 4. Usage distribution
    ax4 = axes[1, 1]
    usage_sorted = effectiveness.sort_values('usageCount', ascending=True)
    ax4.barh(usage_sorted['technique'], usage_sorted['usageCount'])
    ax4.set_xlabel('Usage Count')
    ax4.set_title('Technique Usage Frequency')
    
    plt.tight_layout()
    return fig

def analyze_sessions(data):
    """Analyze session patterns"""
    sessions = data['sessions']
    
    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    
    # Create metrics dataframe
    metrics = {
        'Total Sessions': sessions['totalSessions'],
        'Completed': sessions['completedSessions'],
        'Insights Generated': sessions['totalInsights'],
        'Risks Identified': sessions['totalRisks']
    }
    
    # Bar chart of key metrics
    ax.bar(metrics.keys(), metrics.values())
    ax.set_ylabel('Count')
    ax.set_title('Session Summary Metrics')
    
    # Add completion rate annotation
    completion_rate = (sessions['completedSessions'] / sessions['totalSessions']) * 100
    ax.text(0.5, 0.95, f'Completion Rate: {completion_rate:.1f}%', 
            transform=ax.transAxes, ha='center', va='top',
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    
    return fig

def generate_report(data, output_prefix='telemetry_report'):
    """Generate complete analysis report"""
    print("📊 Generating Creative Thinking Telemetry Report...\n")
    
    # Session summary
    sessions = data['sessions']
    print("📈 Session Summary:")
    print(f"   Total Sessions: {sessions['totalSessions']}")
    print(f"   Completed: {sessions['completedSessions']}")
    print(f"   Completion Rate: {(sessions['completedSessions']/sessions['totalSessions']*100):.1f}%")
    print(f"   Average Duration: {sessions['averageDuration']/1000/60:.1f} minutes")
    print(f"   Total Insights: {sessions['totalInsights']}")
    print(f"   Total Risks: {sessions['totalRisks']}")
    
    # Top techniques
    print("\n🏆 Top Techniques by Effectiveness:")
    effectiveness_df = pd.DataFrame(data['effectiveness'])
    top_techniques = effectiveness_df.nlargest(5, 'averageEffectiveness')
    for _, row in top_techniques.iterrows():
        print(f"   {row['technique']}: {row['averageEffectiveness']:.2f}")
    
    # Generate visualizations
    print("\n📊 Generating visualizations...")
    
    fig1 = analyze_effectiveness(data)
    fig1.savefig(f'{output_prefix}_effectiveness.png', dpi=300, bbox_inches='tight')
    print(f"   ✅ Saved: {output_prefix}_effectiveness.png")
    
    fig2 = analyze_sessions(data)
    fig2.savefig(f'{output_prefix}_sessions.png', dpi=300, bbox_inches='tight')
    print(f"   ✅ Saved: {output_prefix}_sessions.png")
    
    # Export to CSV for further analysis
    effectiveness_df.to_csv(f'{output_prefix}_effectiveness.csv', index=False)
    print(f"   ✅ Saved: {output_prefix}_effectiveness.csv")
    
    print("\n✨ Report generation complete!")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python analyze-telemetry.py <telemetry-export.json>")
        sys.exit(1)
    
    try:
        data = load_telemetry_data(sys.argv[1])
        generate_report(data)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)