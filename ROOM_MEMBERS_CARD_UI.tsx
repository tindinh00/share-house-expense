      {/* Members / Households */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {room.split_by === 'HOUSEHOLD' ? 'Hộ gia đình' : 'Thành viên'} 
              ({room.split_by === 'HOUSEHOLD' ? householdMembers.length : members.length})
            </CardTitle>
            {room.type === 'SHARED' && isOwner && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <span className="mr-2">➕</span>
                    {room.split_by === 'HOUSEHOLD' ? 'Thêm hộ' : 'Mời thành viên'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {room.split_by === 'HOUSEHOLD' ? 'Thêm hộ gia đình' : 'Mời thành viên mới'}
                    </DialogTitle>
                    <DialogDescription>
                      {room.split_by === 'HOUSEHOLD' 
                        ? 'Chọn hộ gia đình để thêm vào room'
                        : 'Nhập email của người bạn muốn mời vào không gian này'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  {room.split_by === 'HOUSEHOLD' ? (
                    // Household invite UI
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Chọn hộ gia đình</Label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          value={selectedHouseholdId}
                          onChange={(e) => setSelectedHouseholdId(e.target.value)}
                        >
                          <option value="">-- Chọn hộ --</option>
                          {userHouseholds.map((h) => (
                            <option key={h.id} value={h.id}>
                              👨‍👩‍👧‍👦 {h.name}
                            </option>
                          ))}
                        </select>
                        {userHouseholds.length === 0 && (
                          <p className="text-sm text-gray-500">
                            Bạn chưa có hộ gia đình nào. <a href="/households/create" className="text-green-600 hover:underline">Tạo hộ mới</a>
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3 justify-end">
                        <DialogTrigger asChild>
                          <Button variant="outline">Hủy</Button>
                        </DialogTrigger>
                        <Button onClick={handleInviteHousehold} disabled={inviting}>
                          {inviting ? 'Đang thêm...' : 'Thêm vào room'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // User invite UI
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="example@email.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <DialogTrigger asChild>
                          <Button variant="outline">Hủy</Button>
                        </DialogTrigger>
                        <Button onClick={handleInvite} disabled={inviting}>
                          {inviting ? 'Đang mời...' : 'Gửi lời mời'}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {room.split_by === 'HOUSEHOLD' ? (
              // Household list
              householdMembers.length > 0 ? (
                householdMembers.map((household) => (
                  <div
                    key={household.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">👨‍👩‍👧‍👦</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {household.households.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {household.member_count} thành viên
                        </p>
                      </div>
                    </div>
                    {isOwner && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Xóa
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa hộ gia đình</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa hộ gia đình này khỏi room?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveHousehold(household.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Chưa có hộ gia đình nào</p>
              )
            ) : (
              // User list (keep existing member UI)
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="font-medium text-green-700">
                        {member.profiles.username?.[0]?.toUpperCase() || 
                         member.profiles.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.profiles.username || 'User'}
                        {member.user_id === currentUserId && (
                          <span className="ml-2 text-xs text-green-600">(Bạn)</span>
                        )}
                        {member.user_id === room.created_by && (
                          <span className="ml-2 text-xs text-blue-600">(Chủ)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{member.profiles.email}</p>
                    </div>
                  </div>
                  {isOwner && member.user_id !== currentUserId && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Xóa
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xác nhận xóa thành viên</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa thành viên này?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveMember(member.id, member.user_id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
