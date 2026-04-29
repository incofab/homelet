<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Http\Requests\Expense\UpdateExpenseRequest;
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
        )->through(fn (Expense $expense): array => $this->serializeExpense($request, $expense));

        return $this->success('Expenses loaded.', [
            'expenses' => $expenses,
        ]);
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $building = Building::query()->findOrFail($request->integer('building_id'));

        $this->authorize('create', [Expense::class, $building]);

        $expense = Expense::query()->create([
            'building_id' => $building->id,
            'expense_category_id' => $this->resolveExpenseCategoryId($request, $building),
            'recorded_by' => $request->user('sanctum')->id,
            'title' => $request->string('title')->toString(),
            'vendor_name' => $request->input('vendor_name'),
            'amount' => $request->integer('amount'),
            'expense_date' => $request->date('expense_date')->toDateString(),
            'payment_method' => $request->input('payment_method'),
            'reference' => $request->input('reference'),
            'description' => $request->input('description'),
            'notes' => $request->input('notes'),
        ]);

        return $this->success('Expense recorded.', [
            'expense' => $this->serializeExpense($request, $expense),
        ], 201);
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): JsonResponse
    {
        $this->authorize('update', $expense);

        $building = Building::query()->findOrFail($request->integer('building_id'));

        $this->authorize('create', [Expense::class, $building]);

        $expense->update([
            'building_id' => $building->id,
            'expense_category_id' => $this->resolveExpenseCategoryId($request, $building),
            'title' => $request->string('title')->toString(),
            'vendor_name' => $request->input('vendor_name'),
            'amount' => $request->integer('amount'),
            'expense_date' => $request->date('expense_date')->toDateString(),
            'payment_method' => $request->input('payment_method'),
            'reference' => $request->input('reference'),
            'description' => $request->input('description'),
            'notes' => $request->input('notes'),
        ]);

        return $this->success('Expense updated.', [
            'expense' => $this->serializeExpense($request, $expense->refresh()),
        ]);
    }

    public function destroy(Request $request, Expense $expense): JsonResponse
    {
        $this->authorize('delete', $expense);

        $expense->delete();

        return $this->success('Expense deleted.');
    }

    private function resolveExpenseCategoryId(Request $request, Building $building): ?int
    {
        $categoryId = $request->integer('expense_category_id');
        if (! $categoryId) {
            return null;
        }

        $category = ExpenseCategory::query()->findOrFail($categoryId);

        if ($category->building_id !== $building->id) {
            throw ValidationException::withMessages([
                'expense_category_id' => ['The selected category does not belong to this building.'],
            ]);
        }

        return $category->id;
    }

    private function serializeExpense(Request $request, Expense $expense): array
    {
        $actor = $request->user('sanctum');

        $expense->loadMissing([
            'building:id,name,owner_id',
            'category:id,building_id,name,color',
            'recorder:id,name',
        ]);

        return [
            ...$expense->toArray(),
            'permissions' => [
                'can_update' => $expense->canBeUpdatedBy($actor),
                'can_delete' => $expense->canBeDeletedBy($actor),
                'update_denial_reason' => $expense->updateRestrictionReasonFor($actor),
                'delete_denial_reason' => $expense->deleteRestrictionReasonFor($actor),
            ],
        ];
    }
}
