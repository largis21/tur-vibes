import { test, expect } from "@playwright/test";

// Mock response for Geonorge stedsnavn API
const mockSearchResults = {
  navn: [
    {
      stedsnummer: 12345,
      skrivemåte: "Bergen",
      navneobjekttype: "by",
      kommuner: [{ kommunenavn: "Bergen" }],
      fylker: [{ fylkesnavn: "Hordaland" }],
      representasjonspunkt: {
        nord: 60.3894,
        øst: 5.3197,
      },
    },
    {
      stedsnummer: 12346,
      skrivemåte: "Fløyen",
      navneobjekttype: "fjell",
      kommuner: [{ kommunenavn: "Bergen" }],
      fylker: [{ fylkesnavn: "Hordaland" }],
      representasjonspunkt: {
        nord: 60.3947,
        øst: 5.2908,
      },
    },
    {
      stedsnummer: 12347,
      skrivemåte: "Ulriken",
      navneobjekttype: "fjell",
      kommuner: [{ kommunenavn: "Bergen" }],
      fylker: [{ fylkesnavn: "Hordaland" }],
      representasjonspunkt: {
        nord: 60.3735,
        øst: 5.2585,
      },
    },
  ],
};

const emptySearchResults = { navn: [] };

test.describe("LocationSearch", () => {
  test("should display search results when query is entered", async ({
    page,
  }) => {
    // Mock the Geonorge API
    await page.route("**/ws.geonorge.no/stedsnavn/v1/navn*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSearchResults),
      });
    });

    await page.goto("/");

    // Open sidebar to reveal LocationSearch
    const menuButton = page.getByTestId("menu-button");
    await menuButton.click();

    // Type in the search box
    const searchInput = page.getByPlaceholder("Search location");
    await searchInput.fill("ber");

    // Wait for debounce (350ms) + API response
    await page.waitForTimeout(360);

    // Assert results are visible
    const resultsList = page.getByTestId("search-results");
    await expect(resultsList).toBeVisible();

    // Check that result items are rendered
    const results = resultsList.locator("li button");
    await expect(results).toHaveCount(3);

    // Verify first result contains expected text
    const firstResult = results.first();
    await expect(firstResult).toContainText("Bergen");
    await expect(firstResult).toContainText("by");
  });

  test("should show 'No results found' message for empty results", async ({
    page,
  }) => {
    await page.route("**/ws.geonorge.no/stedsnavn/v1/navn*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(emptySearchResults),
      });
    });

    await page.goto("/");

    // Open sidebar
    const menuButton = page.getByTestId("menu-button");
    await menuButton.click();

    const searchInput = page.getByPlaceholder("Search location");
    await searchInput.fill("nonexistent");

    // Wait for debounce + API response
    await page.waitForTimeout(360);

    // Assert "No results found" message
    const noResultsMsg = page.locator("text=No results found");
    await expect(noResultsMsg).toBeVisible();
  });

  test("should show error message on API failure", async ({ page }) => {
    await page.route("**/ws.geonorge.no/stedsnavn/v1/navn*", (route) => {
      route.abort();
    });

    await page.goto("/");

    // Open sidebar
    const menuButton = page.getByTestId("menu-button");
    await menuButton.click();

    const searchInput = page.getByPlaceholder("Search location");
    await searchInput.fill("test");

    // Wait for debounce + error handling
    await page.waitForTimeout(360);

    // Assert error message
    const errorMsg = page.locator("text=Search failed. Check your connection.");
    await expect(errorMsg).toBeVisible();
  });

  test("should clear results when clear button is clicked", async ({
    page,
  }) => {
    await page.route("**/ws.geonorge.no/stedsnavn/v1/navn*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSearchResults),
      });
    });

    await page.goto("/");

    // Open sidebar
    const menuButton = page.getByTestId("menu-button");
    await menuButton.click();

    const searchInput = page.getByPlaceholder("Search location");
    await searchInput.fill("ber");

    // Wait for results to appear
    await page.waitForTimeout(360);
    const resultsList = page.getByTestId("search-results");
    await expect(resultsList.locator("li button")).toHaveCount(3);

    // Click clear button
    const clearButton = page.getByRole("button", { name: "Clear search" });
    await clearButton.click();

    // Assert input is cleared and results are gone
    await expect(searchInput).toHaveValue("");
    await expect(resultsList).not.toBeVisible();
  });

  test("should navigate to selected result and close search", async ({
    page,
  }) => {
    await page.route("**/ws.geonorge.no/stedsnavn/v1/navn*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSearchResults),
      });
    });

    await page.goto("/");

    // Open sidebar
    const menuButton = page.getByTestId("menu-button");
    await menuButton.click();

    const searchInput = page.getByPlaceholder("Search location");
    await searchInput.fill("ber");

    // Wait for results
    await page.waitForTimeout(360);

    // Click first result (Bergen)
    const resultsList = page.getByTestId("search-results");
    const firstResult = resultsList.locator("li button").first();
    await firstResult.click();

    // Assert search input is cleared
    await expect(searchInput).toHaveValue("");

    // Assert results dropdown is hidden
    await expect(resultsList).not.toBeVisible();
  });

  test("should show 'Searching...' state while loading", async ({ page }) => {
    await page.route("**/ws.geonorge.no/stedsnavn/v1/navn*", async (route) => {
      // Delay response to catch loading state
      await page.waitForTimeout(100);
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSearchResults),
      });
    });

    await page.goto("/");

    // Open sidebar
    const menuButton = page.getByTestId("menu-button");
    await menuButton.click();

    const searchInput = page.getByPlaceholder("Search location");
    await searchInput.fill("ber");

    // Check for loading state shortly after typing (before debounce completes)
    await page.waitForTimeout(100);
    const loadingMsg = page.locator("text=Searching…");
    await expect(loadingMsg).toBeVisible();

    // Wait for results to appear
    await page.waitForTimeout(360);
    const resultsList = page.getByTestId("search-results");
    await expect(resultsList.locator("li button")).toHaveCount(3);
  });
});
