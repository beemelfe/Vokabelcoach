import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto('http://localhost:8080/')

        # Wait for the main container to be visible
        await page.wait_for_selector('.container')

        # Take a screenshot
        screenshot_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'verification.png')
        await page.screenshot(path=screenshot_path)

        await browser.close()
        print(f"Screenshot saved to {screenshot_path}")

if __name__ == '__main__':
    asyncio.run(main())
