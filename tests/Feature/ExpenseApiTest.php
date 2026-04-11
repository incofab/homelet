<?php

use App\Models\Building;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('manager can create a building expense with category', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);
    $category = ExpenseCategory::factory()->create(['building_id' => $building->id]);

    Sanctum::actingAs($manager);

    $response = $this->postJson('/api/expenses', [
        'building_id' => $building->id,
        'expense_category_id' => $category->id,
        'title' => 'Generator service',
        'vendor_name' => 'PowerFix Ltd',
        'amount' => 120000,
        'expense_date' => '2026-04-10',
        'payment_method' => 'bank_transfer',
        'reference' => 'EXP-100',
        'description' => 'Quarterly generator servicing',
        'notes' => 'Paid same day',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.expense.building.id', $building->id)
        ->assertJsonPath('data.expense.category.id', $category->id)
        ->assertJsonPath('data.expense.recorder.id', $manager->id)
        ->assertJsonPath('data.expense.amount', 120000);
});

test('cannot create expense with category from another building', function () {
    $owner = User::factory()->create();
    $building = Building::factory()->create(['owner_id' => $owner->id]);
    $otherCategory = ExpenseCategory::factory()->create();

    Sanctum::actingAs($owner);

    $response = $this->postJson('/api/expenses', [
        'building_id' => $building->id,
        'expense_category_id' => $otherCategory->id,
        'title' => 'Security patrol',
        'amount' => 80000,
        'expense_date' => '2026-04-10',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['expense_category_id']);
});

test('landlord can list only expenses for accessible buildings', function () {
    $landlord = User::factory()->create();
    $building = Building::factory()->create(['owner_id' => $landlord->id]);
    $category = ExpenseCategory::factory()->create(['building_id' => $building->id]);
    $expense = Expense::factory()->create([
        'building_id' => $building->id,
        'expense_category_id' => $category->id,
        'recorded_by' => $landlord->id,
        'expense_date' => '2026-04-10',
    ]);

    $otherExpense = Expense::factory()->create([
        'expense_date' => '2026-04-11',
    ]);

    Sanctum::actingAs($landlord);

    $response = $this->getJson('/api/expenses');

    $response->assertOk()
        ->assertJsonCount(1, 'data.expenses.data')
        ->assertJsonPath('data.expenses.data.0.id', $expense->id);
});

test('manager can manage expense categories for assigned building', function () {
    $owner = User::factory()->create();
    $manager = User::factory()->create();
    $building = Building::factory()->create(['owner_id' => $owner->id]);
    assignBuildingRole($building, $manager, Building::ROLE_MANAGER);

    Sanctum::actingAs($manager);

    $createResponse = $this->postJson("/api/buildings/{$building->id}/expense-categories", [
        'name' => 'Utilities',
        'color' => '#2563EB',
        'description' => 'Electricity, water, internet',
    ]);

    $createResponse->assertCreated()
        ->assertJsonPath('data.category.name', 'Utilities');

    $categoryId = $createResponse->json('data.category.id');

    $this->putJson("/api/buildings/{$building->id}/expense-categories/{$categoryId}", [
        'name' => 'Utility Bills',
    ])->assertOk()
        ->assertJsonPath('data.category.name', 'Utility Bills');

    $this->getJson("/api/buildings/{$building->id}/expense-categories")
        ->assertOk()
        ->assertJsonCount(1, 'data.categories');

    $this->deleteJson("/api/buildings/{$building->id}/expense-categories/{$categoryId}")
        ->assertOk();

    expect(ExpenseCategory::query()->count())->toBe(0);
});
