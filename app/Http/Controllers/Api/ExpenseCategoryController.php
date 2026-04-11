<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExpenseCategory\StoreExpenseCategoryRequest;
use App\Http\Requests\ExpenseCategory\UpdateExpenseCategoryRequest;
use App\Models\Building;
use App\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    public function index(Request $request, Building $building): JsonResponse
    {
        $this->authorize('viewAny', [ExpenseCategory::class, $building]);

        return $this->success('Expense categories loaded.', [
            'categories' => $building->expenseCategories()->orderBy('name')->get(),
        ]);
    }

    public function store(StoreExpenseCategoryRequest $request, Building $building): JsonResponse
    {
        $this->authorize('create', [ExpenseCategory::class, $building]);

        $category = $building->expenseCategories()->create($request->validated());

        return $this->success('Expense category created.', [
            'category' => $category,
        ], 201);
    }

    public function update(UpdateExpenseCategoryRequest $request, Building $building, ExpenseCategory $expenseCategory): JsonResponse
    {
        if ($expenseCategory->building_id !== $building->id) {
            abort(404);
        }

        $this->authorize('update', $expenseCategory);

        $expenseCategory->update($request->validated());

        return $this->success('Expense category updated.', [
            'category' => $expenseCategory->refresh(),
        ]);
    }

    public function destroy(Request $request, Building $building, ExpenseCategory $expenseCategory): JsonResponse
    {
        if ($expenseCategory->building_id !== $building->id) {
            abort(404);
        }

        $this->authorize('delete', $expenseCategory);
        $expenseCategory->delete();

        return $this->success('Expense category deleted.');
    }
}
