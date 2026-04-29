from __future__ import annotations

import asyncio
import json
import sys
import textwrap
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List

import streamlit as st

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.models.trip import TravelStyle, TripRequest
from app.orchestrator.trip_orchestrator import TripOrchestrator


st.set_page_config(
    page_title="A2A Trip Planner",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="collapsed",
)


CUSTOM_CSS = """
<style>
    .stApp {
        background:
            radial-gradient(circle at top left, rgba(59,130,246,0.12), transparent 28%),
            radial-gradient(circle at bottom right, rgba(249,115,22,0.12), transparent 25%),
            #f5f7fb;
    }

    .block-container {
        padding: 0rem;
        max-width: 100%;
    }

    header[data-testid="stHeader"] {
        background: transparent;
    }

    .lux-hero {
        min-height: 520px;
        padding: 26px 9% 130px 9%;
        color: white;
        position: relative;
        overflow: hidden;
        background:
            linear-gradient(120deg, rgba(2,6,23,0.94), rgba(15,23,42,0.78), rgba(88,28,12,0.68)),
            radial-gradient(circle at 20% 20%, rgba(59,130,246,0.45), transparent 25%),
            radial-gradient(circle at 80% 35%, rgba(249,115,22,0.35), transparent 28%),
            linear-gradient(135deg, #020617, #172554 45%, #7c2d12);
    }

    .lux-hero::before {
        content: "";
        position: absolute;
        width: 420px;
        height: 420px;
        border-radius: 999px;
        background: rgba(56,189,248,0.18);
        filter: blur(80px);
        left: -120px;
        top: 80px;
    }

    .lux-hero::after {
        content: "";
        position: absolute;
        width: 520px;
        height: 520px;
        border-radius: 999px;
        background: rgba(249,115,22,0.18);
        filter: blur(90px);
        right: -120px;
        bottom: -160px;
    }

    .nav-bar {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 70px;
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 1.5rem;
        font-weight: 950;
        letter-spacing: -0.05em;
    }

    .brand-logo {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #2563eb, #38bdf8);
        box-shadow: 0 18px 35px rgba(37,99,235,0.35);
        font-size: 1.25rem;
    }

    .nav-actions {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
    }

    .nav-pill {
        padding: 10px 15px;
        border-radius: 999px;
        color: #e0f2fe;
        background: rgba(255,255,255,0.10);
        border: 1px solid rgba(255,255,255,0.16);
        backdrop-filter: blur(18px);
        font-weight: 800;
        font-size: 0.86rem;
    }

    .nav-login {
        padding: 11px 17px;
        border-radius: 13px;
        color: white;
        background: linear-gradient(90deg, #2563eb, #0ea5e9);
        box-shadow: 0 18px 36px rgba(14,165,233,0.25);
        font-weight: 900;
        font-size: 0.86rem;
    }

    .hero-content {
        position: relative;
        z-index: 2;
        max-width: 940px;
    }

    .hero-kicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255,255,255,0.10);
        border: 1px solid rgba(255,255,255,0.15);
        color: #bfdbfe;
        font-size: 0.82rem;
        font-weight: 850;
        margin-bottom: 18px;
    }

    .hero-title {
        font-size: 4.2rem;
        line-height: 0.98;
        font-weight: 950;
        letter-spacing: -0.075em;
        max-width: 950px;
    }

    .hero-subtitle {
        max-width: 760px;
        margin-top: 20px;
        color: #dbeafe;
        font-size: 1.08rem;
        line-height: 1.75;
    }

    .hero-stats {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 28px;
    }

    .hero-stat {
        padding: 12px 15px;
        border-radius: 18px;
        background: rgba(255,255,255,0.10);
        border: 1px solid rgba(255,255,255,0.14);
        backdrop-filter: blur(18px);
    }

    .hero-stat strong {
        display: block;
        color: white;
        font-size: 1.05rem;
    }

    .hero-stat span {
        color: #cbd5e1;
        font-size: 0.78rem;
        font-weight: 700;
    }

    .category-card {
        width: 76%;
        min-width: 880px;
        margin: -82px auto 0 auto;
        background: rgba(255,255,255,0.92);
        backdrop-filter: blur(20px);
        border-radius: 26px;
        box-shadow: 0 28px 85px rgba(15,23,42,0.18);
        padding: 14px 18px;
        position: relative;
        z-index: 5;
        border: 1px solid rgba(255,255,255,0.72);
    }

    .category-grid {
        display: grid;
        grid-template-columns: repeat(9, 1fr);
        gap: 6px;
        text-align: center;
    }

    .category-item {
        padding: 14px 6px;
        color: #334155;
        font-size: 0.82rem;
        font-weight: 850;
        border-radius: 18px;
        transition: all 0.2s ease;
    }

    .category-item:hover {
        background: #f1f5f9;
        transform: translateY(-1px);
    }

    .category-item-active {
        color: #2563eb;
        background: #eff6ff;
        border-bottom: 4px solid #2563eb;
    }

    .category-icon {
        font-size: 1.7rem;
        display: block;
        margin-bottom: 4px;
    }

    .search-title-card {
        width: 80%;
        min-width: 920px;
        margin: 22px auto 0 auto;
        background: rgba(255,255,255,0.90);
        backdrop-filter: blur(20px);
        border-radius: 26px 26px 0 0;
        padding: 24px 30px 8px 30px;
        border-left: 1px solid rgba(226,232,240,0.9);
        border-right: 1px solid rgba(226,232,240,0.9);
        border-top: 1px solid rgba(226,232,240,0.9);
        box-shadow: 0 16px 45px rgba(15,23,42,0.10);
    }

    .search-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #0f172a;
        gap: 16px;
    }

    .trip-type-row {
        display: flex;
        gap: 20px;
        align-items: center;
        color: #334155;
        font-size: 0.95rem;
        font-weight: 900;
        flex-wrap: wrap;
    }

    .ai-banner {
        padding: 11px 17px;
        border-radius: 999px;
        background: linear-gradient(90deg, #dbeafe, #dcfce7);
        color: #1e40af;
        font-weight: 950;
        font-size: 0.86rem;
        white-space: nowrap;
    }

    div[data-testid="stForm"] {
        width: 80%;
        min-width: 920px;
        margin: 0 auto 0 auto;
        background: rgba(255,255,255,0.94);
        backdrop-filter: blur(20px);
        border-radius: 0 0 26px 26px;
        box-shadow: 0 30px 90px rgba(15,23,42,0.15);
        padding: 8px 30px 30px 30px;
        border-left: 1px solid rgba(226,232,240,0.9);
        border-right: 1px solid rgba(226,232,240,0.9);
        border-bottom: 1px solid rgba(226,232,240,0.9);
    }

    div[data-testid="stTextInput"] label,
    div[data-testid="stDateInput"] label,
    div[data-testid="stNumberInput"] label,
    div[data-testid="stSelectbox"] label,
    div[data-testid="stMultiSelect"] label,
    div[data-testid="stRadio"] label {
        color: #334155 !important;
        font-weight: 900 !important;
        font-size: 0.82rem !important;
    }

    div[data-baseweb="input"],
    div[data-baseweb="select"] {
        background: #ffffff !important;
        border-radius: 16px !important;
        border: 1px solid #dbe3ef !important;
        box-shadow: none !important;
    }

    div[data-baseweb="input"] input,
    div[data-baseweb="select"] div,
    input {
        background: #ffffff !important;
        color: #0f172a !important;
        font-weight: 750 !important;
    }

    div[data-testid="stNumberInput"] button {
        background: #f1f5f9 !important;
        color: #0f172a !important;
        border: 1px solid #dbe3ef !important;
    }

    div[data-testid="stMultiSelect"] span {
        color: white !important;
        font-weight: 800 !important;
    }

    .fare-title {
        color: #0f172a;
        font-weight: 950;
        margin-top: 18px;
        margin-bottom: 10px;
        font-size: 1rem;
    }

    .fare-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 10px;
        margin-bottom: 14px;
    }

    .fare-chip {
        padding: 13px;
        border-radius: 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #334155;
        font-size: 0.82rem;
        font-weight: 850;
        line-height: 1.35;
    }

    .fare-chip-active {
        background: #eff6ff;
        border-color: #60a5fa;
        color: #1d4ed8;
    }

    .stButton > button {
        width: 100%;
        border-radius: 999px;
        padding: 0.92rem 1rem;
        font-size: 1.18rem;
        font-weight: 950;
        border: 0;
        background: linear-gradient(90deg, #38bdf8, #2563eb);
        color: white !important;
        box-shadow: 0 22px 46px rgba(37,99,235,0.30);
        margin-top: 12px;
    }

    .stButton > button:hover {
        filter: brightness(1.04);
        transform: translateY(-1px);
    }

    .results-shell {
        width: 80%;
        min-width: 920px;
        margin: 34px auto 72px auto;
    }

    .section-title {
        color: #0f172a;
        font-size: 1.7rem;
        font-weight: 950;
        letter-spacing: -0.05em;
        margin: 28px 0 16px 0;
    }

    .summary-card {
        background:
            linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.95));
        border: 1px solid #dbeafe;
        border-radius: 26px;
        padding: 25px;
        box-shadow: 0 20px 50px rgba(15,23,42,0.08);
        color: #0f172a;
        font-size: 1.03rem;
        line-height: 1.8;
    }

    .metric-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 22px;
        padding: 18px;
        box-shadow: 0 14px 34px rgba(15,23,42,0.06);
    }

    .metric-label {
        color: #64748b;
        font-size: 0.78rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .metric-value {
        color: #0f172a;
        font-size: 1.45rem;
        font-weight: 950;
        margin-top: 4px;
    }

    .option-card {
        background: white;
        border-radius: 26px;
        padding: 24px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 18px 42px rgba(15,23,42,0.08);
        height: 100%;
    }

    .option-title {
        color: #0f172a;
        font-size: 1.18rem;
        font-weight: 950;
        margin-bottom: 8px;
    }

    .muted {
        color: #64748b;
    }

    .price {
        color: #0f172a;
        font-size: 1.5rem;
        font-weight: 950;
        margin-top: 10px;
    }

    .budget-good,
    .budget-warn,
    .budget-danger {
        padding: 17px 19px;
        border-radius: 20px;
        font-weight: 900;
        margin-top: 14px;
        margin-bottom: 14px;
    }

    .budget-good {
        background: #dcfce7;
        border: 1px solid #86efac;
        color: #166534;
    }

    .budget-warn {
        background: #fef3c7;
        border: 1px solid #fbbf24;
        color: #92400e;
    }

    .budget-danger {
        background: #fee2e2;
        border: 1px solid #fca5a5;
        color: #991b1b;
    }

    .workflow {
        display: grid;
        grid-template-columns: repeat(7, minmax(105px, 1fr));
        gap: 10px;
        margin: 14px 0 18px 0;
    }

    .agent-node {
        background: white;
        color: #334155;
        border: 1px solid #e2e8f0;
        padding: 15px 10px;
        text-align: center;
        border-radius: 18px;
        font-size: 0.82rem;
        font-weight: 900;
        box-shadow: 0 12px 28px rgba(15,23,42,0.06);
    }

    .agent-node-active {
        background: linear-gradient(90deg, #2563eb, #0ea5e9);
        color: white;
        border-color: transparent;
    }

    .day-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 24px;
        padding: 23px;
        margin-bottom: 15px;
        box-shadow: 0 16px 38px rgba(15,23,42,0.06);
    }

    .day-title {
        color: #0f172a;
        font-weight: 950;
        font-size: 1.2rem;
        margin-bottom: 8px;
    }

    .time-label {
        color: #2563eb;
        font-weight: 950;
    }

    .footer-note {
        margin-top: 42px;
        color: #64748b;
        text-align: center;
        font-size: 0.92rem;
    }

    @media (max-width: 1100px) {
        .category-card,
        .search-title-card,
        div[data-testid="stForm"],
        .results-shell {
            width: 94%;
            min-width: auto;
        }

        .category-grid {
            grid-template-columns: repeat(3, 1fr);
        }

        .fare-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .workflow {
            grid-template-columns: repeat(2, 1fr);
        }

        .lux-hero {
            padding-left: 5%;
            padding-right: 5%;
        }

        .hero-title {
            font-size: 2.5rem;
        }

        .nav-bar {
            align-items: flex-start;
            gap: 14px;
            flex-direction: column;
        }

        .nav-actions {
            flex-wrap: wrap;
        }
    }
</style>
"""


def html(markup: str) -> None:
    st.html(textwrap.dedent(markup).strip())


def run_async_trip_planner(trip_request: TripRequest) -> Dict[str, Any]:
    orchestrator = TripOrchestrator()
    return asyncio.run(orchestrator.plan_trip(trip_request))


def currency_amount(currency: str, amount: float) -> str:
    return f"{currency} {amount:,.0f}"


def render_hero() -> None:
    html(
        """
        <div class="lux-hero">
            <div class="nav-bar">
                <div class="brand">
                    <div class="brand-logo">✈️</div>
                    <div>A2A Trip</div>
                </div>

                <div class="nav-actions">
                    <div class="nav-pill">List Your Property</div>
                    <div class="nav-pill">Wishlist</div>
                    <div class="nav-pill">My Trips</div>
                    <div class="nav-login">Login / Create Account</div>
                    <div class="nav-pill">INR | English</div>
                </div>
            </div>

            <div class="hero-content">
                <div class="hero-kicker">⚡ Offline-first · Multi-agent travel intelligence</div>

                <div class="hero-title">
                    Plan smarter trips with multi-agent AI orchestration.
                </div>

                <div class="hero-subtitle">
                    Search flights, stays, activities, weather, pricing and a full day-by-day itinerary
                    using specialized agents coordinated by one central orchestrator.
                </div>

                <div class="hero-stats">
                    <div class="hero-stat">
                        <strong>6 Agents</strong>
                        <span>Flights, hotels, weather, activities, pricing, itinerary</span>
                    </div>
                    <div class="hero-stat">
                        <strong>A2A Protocol</strong>
                        <span>Structured agent-to-agent communication</span>
                    </div>
                    <div class="hero-stat">
                        <strong>Free Mode</strong>
                        <span>No paid APIs, mock providers, real architecture</span>
                    </div>
                </div>
            </div>
        </div>
        """
    )


def render_category_card() -> None:
    categories = [
        ("✈️", "Flights", True),
        ("🏨", "Hotels", False),
        ("🏡", "Villas & Homes", False),
        ("🌴", "Holiday Packages", False),
        ("🚆", "Trains", False),
        ("🚌", "Buses", False),
        ("🚕", "Cabs", False),
        ("🎈", "Tours", False),
        ("🛡️", "Insurance", False),
    ]

    items = ""

    for icon, label, active in categories:
        css = "category-item category-item-active" if active else "category-item"
        items += f"""
        <div class="{css}">
            <span class="category-icon">{icon}</span>
            <div>{label}</div>
        </div>
        """

    html(
        f"""
        <div class="category-card">
            <div class="category-grid">
                {items}
            </div>
        </div>
        """
    )


def render_search_title() -> None:
    html(
        """
        <div class="search-title-card">
            <div class="search-title-row">
                <div class="trip-type-row">
                    <span>● One Way</span>
                    <span>○ Round Trip</span>
                    <span>○ Multi City</span>
                </div>
                <div class="ai-banner">Try A2A AI Assistant for Flights & Stays →</div>
            </div>
        </div>
        """
    )


def render_search_form() -> TripRequest | None:
    render_search_title()

    with st.form("travel_search_form"):
        col1, col2, col3, col4, col5 = st.columns([1.25, 1.25, 1, 1, 1])

        with col1:
            source_city = st.text_input("From", value="Delhi")

        with col2:
            destination_city = st.text_input("To", value="Bengaluru")

        with col3:
            start_date = st.date_input(
                "Departure",
                value=date.today() + timedelta(days=30),
            )

        with col4:
            end_date = st.date_input(
                "Return",
                value=date.today() + timedelta(days=34),
            )

        with col5:
            travelers = st.number_input(
                "Travellers",
                min_value=1,
                value=1,
                step=1,
            )

        col6, col7, col8 = st.columns([1.2, 1.2, 2])

        with col6:
            budget = st.number_input(
                "Budget",
                min_value=1000.0,
                value=35000.0,
                step=1000.0,
            )

        with col7:
            currency = st.selectbox(
                "Currency",
                options=["INR", "USD", "EUR", "GBP"],
                index=0,
            )

        with col8:
            interests = st.multiselect(
                "Interests",
                options=[
                    "beaches",
                    "nightlife",
                    "local food",
                    "culture",
                    "adventure",
                ],
                default=["culture", "local food"],
            )

        travel_style_text = st.radio(
            "Special Fares / Travel Style",
            options=[
                TravelStyle.BUDGET.value,
                TravelStyle.BALANCED.value,
                TravelStyle.PREMIUM.value,
            ],
            index=1,
            horizontal=True,
        )

        html(
            """
            <div class="fare-title">Special Fares</div>
            <div class="fare-grid">
                <div class="fare-chip fare-chip-active">
                    Regular<br><span class="muted">Best value plan</span>
                </div>
                <div class="fare-chip">
                    Student<br><span class="muted">Extra savings</span>
                </div>
                <div class="fare-chip">
                    Armed Forces<br><span class="muted">Priority options</span>
                </div>
                <div class="fare-chip">
                    Senior Citizen<br><span class="muted">Comfort focused</span>
                </div>
                <div class="fare-chip">
                    Premium<br><span class="muted">Better hotels</span>
                </div>
                <div class="fare-chip">
                    AI Smart Deal<br><span class="muted">Agent optimized</span>
                </div>
            </div>
            """
        )

        submitted = st.form_submit_button("SEARCH")

    if not submitted:
        return None

    if end_date < start_date:
        st.error("Return date cannot be earlier than departure date.")
        return None

    if not source_city.strip() or not destination_city.strip():
        st.error("From and To cities are required.")
        return None

    return TripRequest(
        source_city=source_city.strip(),
        destination_city=destination_city.strip(),
        start_date=start_date,
        end_date=end_date,
        budget=budget,
        currency=currency,
        travelers=int(travelers),
        interests=interests,
        travel_style=TravelStyle(travel_style_text),
    )


def render_agent_workflow() -> None:
    html('<div class="section-title">Agent Workflow</div>')

    html(
        """
        <div class="workflow">
            <div class="agent-node agent-node-active">User Request</div>
            <div class="agent-node agent-node-active">Orchestrator</div>
            <div class="agent-node">Flight Agent</div>
            <div class="agent-node">Hotel Agent</div>
            <div class="agent-node">Weather Agent</div>
            <div class="agent-node">Activity Agent</div>
            <div class="agent-node agent-node-active">Final Plan</div>
        </div>
        <div class="workflow">
            <div class="agent-node">A2A Messages</div>
            <div class="agent-node">Trip State</div>
            <div class="agent-node">Provider Layer</div>
            <div class="agent-node">Pricing Agent</div>
            <div class="agent-node">Itinerary Agent</div>
            <div class="agent-node">Budget Engine</div>
            <div class="agent-node">Export JSON</div>
        </div>
        """
    )


def render_summary(summary: str) -> None:
    html('<div class="section-title">Trip Summary</div>')
    html(f'<div class="summary-card">{summary}</div>')


def render_metrics(final_plan: Dict[str, Any]) -> None:
    request = final_plan["request"]
    budget = final_plan["budget_breakdown"]
    currency = request["currency"]

    metrics = [
        ("Total Cost", currency_amount(currency, budget["total_estimated_cost"])),
        ("Remaining", currency_amount(currency, budget["remaining_budget"])),
        ("Travellers", str(request["travelers"])),
        ("Trip Days", str(len(final_plan["itinerary"]))),
    ]

    cols = st.columns(4)

    for col, (label, value) in zip(cols, metrics):
        with col:
            html(
                f"""
                <div class="metric-card">
                    <div class="metric-label">{label}</div>
                    <div class="metric-value">{value}</div>
                </div>
                """
            )


def render_budget_health(final_plan: Dict[str, Any]) -> None:
    request = final_plan["request"]
    budget = final_plan["budget_breakdown"]

    remaining = budget["remaining_budget"]
    total_budget = request["budget"]
    currency = request["currency"]

    if remaining < 0:
        css_class = "budget-danger"
        message = (
            f"Over budget by {currency_amount(currency, abs(remaining))}. "
            "Try budget style, fewer activities, or cheaper hotel options."
        )
    elif remaining <= total_budget * 0.10:
        css_class = "budget-warn"
        message = (
            f"Tight budget. Only {currency_amount(currency, remaining)} remains. "
            "Keep extra cash for real-world price changes."
        )
    else:
        css_class = "budget-good"
        message = (
            f"Healthy budget. {currency_amount(currency, remaining)} remains after estimated costs."
        )

    html(f'<div class="{css_class}">{message}</div>')


def render_selected_options(final_plan: Dict[str, Any]) -> None:
    currency = final_plan["request"]["currency"]
    flight = final_plan["selected_flight"]
    hotel = final_plan["selected_hotel"]

    col1, col2 = st.columns(2)

    with col1:
        html(
            f"""
            <div class="option-card">
                <div class="option-title">✈️ Recommended Flight</div>
                <div class="muted">{flight["source_city"]} → {flight["destination_city"]}</div>
                <h3>{flight["airline"]} {flight["flight_number"]}</h3>
                <p class="muted">
                    {flight["departure_time"]} → {flight["arrival_time"]} · {flight["duration"]}
                </p>
                <div class="price">{currency_amount(currency, flight["price"])}</div>
            </div>
            """
        )

    with col2:
        html(
            f"""
            <div class="option-card">
                <div class="option-title">🏨 Recommended Stay</div>
                <div class="muted">{hotel["location"]}</div>
                <h3>{hotel["name"]}</h3>
                <p class="muted">Rating {hotel["rating"]}/5 · {hotel["nights"]} nights</p>
                <p class="muted">{", ".join(hotel["amenities"])}</p>
                <div class="price">{currency_amount(currency, hotel["total_price"])}</div>
            </div>
            """
        )


def render_budget(final_plan: Dict[str, Any]) -> None:
    currency = final_plan["request"]["currency"]
    budget = final_plan["budget_breakdown"]

    rows = [
        {"Item": "Flights", "Cost": currency_amount(currency, budget["flights"])},
        {"Item": "Hotels", "Cost": currency_amount(currency, budget["hotels"])},
        {"Item": "Activities", "Cost": currency_amount(currency, budget["activities"])},
        {"Item": "Food", "Cost": currency_amount(currency, budget["food"])},
        {
            "Item": "Local Transport",
            "Cost": currency_amount(currency, budget["local_transport"]),
        },
        {
            "Item": "Safety Buffer",
            "Cost": currency_amount(currency, budget["buffer"]),
        },
        {
            "Item": "Total Estimated Cost",
            "Cost": currency_amount(currency, budget["total_estimated_cost"]),
        },
        {
            "Item": "Remaining Budget",
            "Cost": currency_amount(currency, budget["remaining_budget"]),
        },
    ]

    st.table(rows)


def render_itinerary(final_plan: Dict[str, Any]) -> None:
    currency = final_plan["request"]["currency"]

    for day in final_plan["itinerary"]:
        html(
            f"""
            <div class="day-card">
                <div class="day-title">Day {day["day"]} — {day["title"]}</div>
                <p class="muted"><b>Date:</b> {day["date"]}</p>
                <p><span class="time-label">Morning:</span> {day["morning"]}</p>
                <p><span class="time-label">Afternoon:</span> {day["afternoon"]}</p>
                <p><span class="time-label">Evening:</span> {day["evening"]}</p>
                <p><span class="time-label">Weather:</span> {day["weather_note"]}</p>
                <p>
                    <span class="time-label">Estimated Cost:</span>
                    {currency_amount(currency, day["estimated_cost"])}
                </p>
            </div>
            """
        )


def render_booking_links(final_plan: Dict[str, Any]) -> None:
    st.caption(
        "Free version uses generated search links. Real booking APIs can be plugged in later through provider classes."
    )

    for index, link in enumerate(final_plan["booking_links"], start=1):
        st.link_button(f"Open Search Link {index}", link)


def render_logs(logs: List[str]) -> None:
    for index, log in enumerate(logs, start=1):
        st.write(f"{index:02d}. {log}")


def render_download_button(final_plan: Dict[str, Any]) -> None:
    json_data = json.dumps(final_plan, indent=2, ensure_ascii=False, default=str)

    st.download_button(
        label="Download Full Trip Plan JSON",
        data=json_data,
        file_name="a2a_trip_plan.json",
        mime="application/json",
        use_container_width=True,
    )


def render_result(result: Dict[str, Any]) -> None:
    final_plan = result["final_trip_plan"]

    html('<div class="results-shell">')

    render_summary(result["summary"])
    render_metrics(final_plan)
    render_budget_health(final_plan)

    tab_overview, tab_itinerary, tab_budget, tab_agents, tab_export = st.tabs(
        ["Overview", "Itinerary", "Budget", "Agents", "Export"]
    )

    with tab_overview:
        render_agent_workflow()
        html('<div class="section-title">Recommended Options</div>')
        render_selected_options(final_plan)

        html('<div class="section-title">Booking/Search Links</div>')
        render_booking_links(final_plan)

    with tab_itinerary:
        html('<div class="section-title">Day-by-Day Itinerary</div>')
        render_itinerary(final_plan)

    with tab_budget:
        html('<div class="section-title">Detailed Budget Breakdown</div>')
        render_budget(final_plan)

    with tab_agents:
        html('<div class="section-title">Orchestration Logs</div>')
        render_logs(result["orchestration_logs"])

        with st.expander("View Raw Agent Outputs"):
            st.json(result["agent_outputs"])

    with tab_export:
        html('<div class="section-title">Export Trip Plan</div>')
        st.write("Download the complete structured output generated by the orchestrator.")
        render_download_button(final_plan)
        st.json(final_plan)

    html(
        """
        <div class="footer-note">
            Built as an offline-first A2A multi-agent travel planner.
            Real APIs can be plugged in through provider classes.
        </div>
        """
    )

    html("</div>")


def main() -> None:
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

    render_hero()
    render_category_card()
    trip_request = render_search_form()

    if trip_request is None:
        html('<div class="results-shell">')
        render_agent_workflow()
        st.info("Enter trip details and click SEARCH to generate the full agentic travel plan.")
        html("</div>")
        return

    with st.spinner(
        "A2A agents are planning flights, hotels, weather, activities, pricing, and itinerary..."
    ):
        try:
            result = run_async_trip_planner(trip_request)
        except Exception as exc:
            st.error(f"Trip planning failed: {exc}")
            return

    st.success("Trip plan generated successfully.")
    render_result(result)


if __name__ == "__main__":
    main()