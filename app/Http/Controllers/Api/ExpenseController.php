<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Models\Building;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Expense::class);

        $user = $request->user('sanctum');
        $buildingIds = $user->buildingIdsForRoles([Building::ROLE_LANDLORD, Building::ROLE_MANAGER]);

        $expenses = paginateFromRequest(
            Expense::query()
                ->with([
                    'building:id,name',
                    'category:id,building_id,name,color',
                    'recorder:id,name',
                ])
                ->when($request->integer('building_id'), function ($query, $buildingId) {
                    $query->where('building_id', $buildingId);
                })
                ->when($request->integer('category_id'), function ($query, $categoryId) {
                    $query->where('expense_category_id', $categoryId);
                })
                ->when(! $user->isPlatformAdmin(), function ($query) use ($buildingIds) {
                    $query->whereIn('building_id', $buildingIds);
                })
                ->orderByDesc('expense_date')
                ->orderByDesc('id')
        );

        return $this->success('Expenses loaded.', [
            'expenses' => $expenses,
        ]);
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $building = Building::query()->findOrFail($request->integer('building_id'));

        $this->authorize('create', [Expense::class, $building]);

        $categoryId = $request->integer('expense_category_id');
        if ($categoryId) {
            $category = ExpenseCategory::query()->findOrFail($categoryId);

            if ($category->building_id !== $building->id) {
                throw ValidationException::withMessages([
                    'expense_category_id' => ['The selected category does not belong to this building.'],
                ]);
            }
        }

        $expense = Expense::query()->create([
            'building_id' => $building->id,
            'expense_category_id' => $categoryId ?: null,
            'recorded_by' => $request->user('sanctum')->id,
            'title' => $request->string('title')->toString(),
            'vendor_name' => $request->input('vendor_name'),
            'amount' => $request->integer('amount'),
            'expense_date' => $request->date('expense_date')->toDateString(),
            'payment_method' => $request->input('payment_method'),
            'reference' => $request->input('reference'),
            'description' => $request->input('description'),
            'notes' => $request->input('notes'),
        ])->load([
            'building:id,name',
            'category:id,building_id,name,color',
            'recorder:id,name',
        ]);

        return $this->success('Expense recorded.', [
            'expense' => $expense,
        ], 201);
    }
}
