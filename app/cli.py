from __future__ import annotations

import asyncio
from datetime import date
from typing import List

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from app.models.trip import TravelStyle, TripRequest
from app.orchestrator.trip_orchestrator import TripOrchestrator


app = typer.Typer(
    name="a2a-trip-planner",
    help="Industry-style A2A multi-agent trip planner CLI.",
    add_completion=False,
)

console = Console()


def parse_date(value: str) -> date:
    try:
        return date.fromisoformat(value.strip())
    except ValueError as exc:
        raise typer.BadParameter("Date must be in YYYY-MM-DD format.") from exc


def parse_interests(value: str) -> List[str]:
    return [
        interest.strip().lower()
        for interest in value.split(",")
        if interest.strip()
    ]


def parse_travel_style(value: str) -> TravelStyle:
    normalized = value.strip().lower()

    try:
        return TravelStyle(normalized)
    except ValueError as exc:
        allowed = ", ".join(style.value for style in TravelStyle)
        raise typer.BadParameter(f"Travel style must be one of: {allowed}") from exc


def render_logs(logs: List[str]) -> None:
    console.print("\n[bold cyan]Agent Orchestration Logs[/bold cyan]")

    for index, log in enumerate(logs, start=1):
        console.print(f"[dim]{index:02d}.[/dim] {log}")


def render_summary(summary: str) -> None:
    console.print(
        Panel.fit(
            summary,
            title="Trip Summary",
            border_style="cyan",
        )
    )


def render_selected_options(final_plan: dict) -> None:
    currency = final_plan["request"]["currency"]
    flight = final_plan["selected_flight"]
    hotel = final_plan["selected_hotel"]

    table = Table(title="Selected Travel Options")
    table.add_column("Category", style="cyan", no_wrap=True)
    table.add_column("Selection")
    table.add_column("Cost")

    table.add_row(
        "Flight",
        f"{flight['airline']} {flight['flight_number']} "
        f"({flight['departure_time']} → {flight['arrival_time']})",
        f"{currency} {flight['price']:,.0f}",
    )

    table.add_row(
        "Hotel",
        f"{hotel['name']} | Rating {hotel['rating']} | {hotel['nights']} nights",
        f"{currency} {hotel['total_price']:,.0f}",
    )

    console.print(table)


def render_budget(final_plan: dict) -> None:
    currency = final_plan["request"]["currency"]
    budget = final_plan["budget_breakdown"]

    table = Table(title="Detailed Budget Breakdown")
    table.add_column("Item", style="cyan")
    table.add_column("Cost", justify="right")

    table.add_row("Flights", f"{currency} {budget['flights']:,.0f}")
    table.add_row("Hotels", f"{currency} {budget['hotels']:,.0f}")
    table.add_row("Activities", f"{currency} {budget['activities']:,.0f}")
    table.add_row("Food", f"{currency} {budget['food']:,.0f}")
    table.add_row("Local Transport", f"{currency} {budget['local_transport']:,.0f}")
    table.add_row("Safety Buffer", f"{currency} {budget['buffer']:,.0f}")
    table.add_section()
    table.add_row(
        "[bold]Total Estimated Cost[/bold]",
        f"[bold]{currency} {budget['total_estimated_cost']:,.0f}[/bold]",
    )
    table.add_row(
        "[bold]Remaining Budget[/bold]",
        f"[bold]{currency} {budget['remaining_budget']:,.0f}[/bold]",
    )

    console.print(table)


def render_itinerary(final_plan: dict) -> None:
    console.print("\n[bold cyan]Day-by-Day Itinerary[/bold cyan]")

    for day in final_plan["itinerary"]:
        content = (
            f"[bold]Date:[/bold] {day['date']}\n\n"
            f"[bold]Morning:[/bold] {day['morning']}\n\n"
            f"[bold]Afternoon:[/bold] {day['afternoon']}\n\n"
            f"[bold]Evening:[/bold] {day['evening']}\n\n"
            f"[bold]Estimated Cost:[/bold] "
            f"{final_plan['request']['currency']} {day['estimated_cost']:,.0f}\n\n"
            f"[bold]Weather:[/bold] {day['weather_note']}"
        )

        console.print(
            Panel(
                content,
                title=f"Day {day['day']} - {day['title']}",
                border_style="green",
            )
        )


def render_booking_links(final_plan: dict) -> None:
    console.print("\n[bold cyan]Booking/Search Links[/bold cyan]")

    for index, link in enumerate(final_plan["booking_links"], start=1):
        console.print(f"{index}. {link}")


async def run_trip_planner(
    source_city: str,
    destination_city: str,
    start_date_text: str,
    end_date_text: str,
    budget: float,
    currency: str,
    travelers: int,
    interests_text: str,
    travel_style_text: str,
) -> None:
    start = parse_date(start_date_text)
    end = parse_date(end_date_text)

    if end < start:
        raise typer.BadParameter("End date cannot be earlier than start date.")

    trip_request = TripRequest(
        source_city=source_city.strip(),
        destination_city=destination_city.strip(),
        start_date=start,
        end_date=end,
        budget=budget,
        currency=currency.strip().upper(),
        travelers=travelers,
        interests=parse_interests(interests_text),
        travel_style=parse_travel_style(travel_style_text),
    )

    console.print("\n[bold yellow]Planning your trip using A2A agents...[/bold yellow]\n")

    orchestrator = TripOrchestrator()
    result = await orchestrator.plan_trip(trip_request)

    final_plan = result["final_trip_plan"]

    console.print("[bold green]Trip plan generated successfully.[/bold green]\n")

    render_summary(result["summary"])
    render_logs(result["orchestration_logs"])
    render_selected_options(final_plan)
    render_budget(final_plan)
    render_itinerary(final_plan)
    render_booking_links(final_plan)


@app.command()
def plan(
    source_city: str = typer.Option(..., prompt=True, help="Starting city"),
    destination_city: str = typer.Option(..., prompt=True, help="Destination city"),
    start_date: str = typer.Option(..., prompt=True, help="Trip start date YYYY-MM-DD"),
    end_date: str = typer.Option(..., prompt=True, help="Trip end date YYYY-MM-DD"),
    budget: float = typer.Option(..., prompt=True, help="Total trip budget"),
    currency: str = typer.Option("INR", prompt=True, help="Currency code"),
    travelers: int = typer.Option(1, prompt=True, help="Number of travelers"),
    interests: str = typer.Option(
        "beaches, local food",
        prompt=True,
        help="Comma-separated interests",
    ),
    travel_style: str = typer.Option(
        "balanced",
        prompt=True,
        help="budget, balanced, or premium",
    ),
) -> None:
    """
    Generate a complete multi-agent travel plan from terminal input.
    """

    asyncio.run(
        run_trip_planner(
            source_city=source_city,
            destination_city=destination_city,
            start_date_text=start_date,
            end_date_text=end_date,
            budget=budget,
            currency=currency,
            travelers=travelers,
            interests_text=interests,
            travel_style_text=travel_style,
        )
    )


if __name__ == "__main__":
    app()